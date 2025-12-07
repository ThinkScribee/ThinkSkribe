import Job from '../models/Job.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';
import { uploadToS3 } from '../utils/upload.js';
import asyncHandler from '../middlewares/async.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get all jobs (for writers to browse)
// @route   GET /api/jobs
// @access  Public (writers can view all open jobs)
export const getJobs = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    jobType,
    academicLevel,
    subject,
    minBudget,
    maxBudget,
    status = 'open',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search
  } = req.query;

  // Build filter object
  const filter = {
    isActive: true,
    status: status
  };

  // Add filters
  if (jobType) filter.jobType = jobType;
  if (academicLevel) filter.academicLevel = academicLevel;
  if (subject) filter.subject = new RegExp(subject, 'i');
  if (minBudget || maxBudget) {
    filter['budget.amount'] = {};
    if (minBudget) filter['budget.amount'].$gte = Number(minBudget);
    if (maxBudget) filter['budget.amount'].$lte = Number(maxBudget);
  }

  // Text search
  if (search) {
    filter.$text = { $search: search };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query
  const jobs = await Job.find(filter)
    .populate('postedBy', 'name avatar role')
    .populate('applications.writer', 'name avatar')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  // Get total count for pagination
  const total = await Job.countDocuments(filter);

  // Add view tracking for authenticated users
  if (req.user && req.user.role === 'writer') {
    const viewPromises = jobs.map(job => job.addView(req.user._id));
    await Promise.all(viewPromises);
  }

  res.status(200).json({
    success: true,
    data: jobs,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / limit),
      total,
      limit: Number(limit)
    }
  });
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
export const getJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id)
    .populate('postedBy', 'name avatar role email')
    .populate('applications.writer', 'name avatar role writerProfile')
    .populate('assignedTo', 'name avatar role');

  if (!job) {
    return next(new ErrorResponse('Job not found', 404));
  }

  // Add view tracking for authenticated users
  if (req.user && req.user.role === 'writer') {
    await job.addView(req.user._id);
  }

  res.status(200).json({
    success: true,
    data: job
  });
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (students only)
export const createJob = asyncHandler(async (req, res, next) => {
  // Check if user is a student
  if (req.user.role !== 'student') {
    return next(new ErrorResponse('Only students can post jobs', 403));
  }

  const jobData = {
    ...req.body,
    postedBy: req.user._id
  };

  // Validate budget
  const budgetValidation = Job.validateBudget(
    jobData.jobType,
    jobData.budget.amount,
    jobData.budget.currency
  );

  if (!budgetValidation.valid) {
    return next(new ErrorResponse(budgetValidation.message, 400));
  }

  // Create job
  const job = await Job.create(jobData);

  // Populate the created job
  const populatedJob = await Job.findById(job._id)
    .populate('postedBy', 'name avatar role');

  // Emit real-time event to all writers
  const io = getIO();
  io.emit('newJobPosted', {
    job: populatedJob,
    message: 'New job posted!',
    timestamp: new Date()
  });

  res.status(201).json({
    success: true,
    data: populatedJob
  });
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (job owner only)
export const updateJob = asyncHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse('Job not found', 404));
  }

  // Check if user is the job owner
  if (job.postedBy.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized to update this job', 403));
  }

  // Check if job can be updated (not in progress or completed)
  if (['in-progress', 'completed'].includes(job.status)) {
    return next(new ErrorResponse('Cannot update job that is in progress or completed', 400));
  }

  // Validate budget if it's being updated
  if (req.body.budget) {
    const budgetValidation = Job.validateBudget(
      req.body.jobType || job.jobType,
      req.body.budget.amount,
      req.body.budget.currency
    );

    if (!budgetValidation.valid) {
      return next(new ErrorResponse(budgetValidation.message, 400));
    }
  }

  // Update job
  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('postedBy', 'name avatar role');

  // Emit real-time event
  const io = getIO();
  io.emit('jobUpdated', {
    job,
    message: 'Job has been updated',
    timestamp: new Date()
  });

  res.status(200).json({
    success: true,
    data: job
  });
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (job owner only)
export const deleteJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse('Job not found', 404));
  }

  // Check if user is the job owner
  if (job.postedBy.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized to delete this job', 403));
  }

  // Check if job can be deleted (not in progress or completed)
  if (['in-progress', 'completed'].includes(job.status)) {
    return next(new ErrorResponse('Cannot delete job that is in progress or completed', 400));
  }

  await Job.findByIdAndDelete(req.params.id);

  // Emit real-time event
  const io = getIO();
  io.emit('jobDeleted', {
    jobId: req.params.id,
    message: 'Job has been deleted',
    timestamp: new Date()
  });

  res.status(200).json({
    success: true,
    message: 'Job deleted successfully'
  });
});

// @desc    Get user's posted jobs
// @route   GET /api/jobs/my-jobs
// @access  Private (students only)
export const getMyJobs = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status
  } = req.query;

  const filter = {
    postedBy: req.user._id
  };

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const jobs = await Job.find(filter)
    .populate('applications.writer', 'name avatar role')
    .populate('assignedTo', 'name avatar role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Job.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: jobs,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / limit),
      total,
      limit: Number(limit)
    }
  });
});

// @desc    Apply for job
// @route   POST /api/jobs/:id/apply
// @access  Private (writers only)
export const applyForJob = asyncHandler(async (req, res, next) => {
  // Check if user is a writer
  if (req.user.role !== 'writer') {
    return next(new ErrorResponse('Only writers can apply for jobs', 403));
  }

  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse('Job not found', 404));
  }

  // Check if job is still open
  if (job.status !== 'open') {
    return next(new ErrorResponse('This job is no longer accepting applications', 400));
  }

  // Check if writer is not the job poster
  if (job.postedBy.toString() === req.user._id.toString()) {
    return next(new ErrorResponse('You cannot apply for your own job', 400));
  }

  try {
    await job.addApplication(req.user._id, req.body);

    // Populate the updated job
    const updatedJob = await Job.findById(job._id)
      .populate('postedBy', 'name avatar role')
      .populate('applications.writer', 'name avatar role');

    // Emit real-time event to job poster
    const io = getIO();
    io.to(`user-${job.postedBy}`).emit('newJobApplication', {
      job: updatedJob,
      application: updatedJob.applications.find(app => 
        app.writer._id.toString() === req.user._id.toString()
      ),
      message: `New application from ${req.user.name}`,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      data: updatedJob
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

// @desc    Accept application
// @route   PUT /api/jobs/:id/accept-application/:applicationId
// @access  Private (job owner only)
export const acceptApplication = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse('Job not found', 404));
  }

  // Check if user is the job owner
  if (job.postedBy.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized to accept applications for this job', 403));
  }

  // Find the application
  const application = job.applications.id(req.params.applicationId);
  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  // Check if job is still open
  if (job.status !== 'open') {
    return next(new ErrorResponse('This job is no longer accepting applications', 400));
  }

  // Update application status
  application.status = 'accepted';
  job.assignedTo = application.writer;
  job.status = 'in-progress';

  await job.save();

  // Reject all other applications
  job.applications.forEach(app => {
    if (app._id.toString() !== req.params.applicationId) {
      app.status = 'rejected';
    }
  });

  await job.save();

  // Populate the updated job
  const updatedJob = await Job.findById(job._id)
    .populate('postedBy', 'name avatar role')
    .populate('applications.writer', 'name avatar role')
    .populate('assignedTo', 'name avatar role');

  // Emit real-time events
  const io = getIO();
  
  // Notify the accepted writer
  io.to(`user-${application.writer}`).emit('applicationAccepted', {
    job: updatedJob,
    message: 'Your application has been accepted!',
    timestamp: new Date()
  });

  // Notify all rejected writers
  job.applications.forEach(app => {
    if (app.status === 'rejected' && app._id.toString() !== req.params.applicationId) {
      io.to(`user-${app.writer}`).emit('applicationRejected', {
        job: updatedJob,
        message: 'Your application was not selected for this job',
        timestamp: new Date()
      });
    }
  });

  res.status(200).json({
    success: true,
    message: 'Application accepted successfully',
    data: updatedJob
  });
});

// @desc    Upload job attachment
// @route   POST /api/jobs/:id/attachments
// @access  Private (job owner only)
export const uploadJobAttachment = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse('Job not found', 404));
  }

  // Check if user is the job owner
  if (job.postedBy.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized to upload attachments for this job', 403));
  }

  if (!req.file) {
    return next(new ErrorResponse('No file provided', 400));
  }

  try {
    // Upload file to S3
    const s3Data = await uploadToS3(req.file, 'job-attachments');

    // Add attachment to job
    const attachment = {
      name: req.file.originalname,
      url: s3Data.Location,
      type: req.file.mimetype,
      size: req.file.size
    };

    job.attachments.push(attachment);
    await job.save();

    res.status(200).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: attachment
    });
  } catch (error) {
    return next(new ErrorResponse('Failed to upload attachment', 500));
  }
});

// @desc    Get job pricing information
// @route   GET /api/jobs/pricing
// @access  Public
export const getJobPricing = asyncHandler(async (req, res, next) => {
  const pricing = Job.getJobPricing();

  res.status(200).json({
    success: true,
    data: pricing
  });
});

// @desc    Get job statistics
// @route   GET /api/jobs/stats
// @access  Private (admin only)
export const getJobStats = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access job statistics', 403));
  }

  const stats = await Job.aggregate([
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        openJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        },
        inProgressJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
        },
        completedJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalApplications: {
          $sum: { $size: '$applications' }
        },
        averageBudget: { $avg: '$budget.amount' }
      }
    }
  ]);

  const jobTypeStats = await Job.aggregate([
    {
      $group: {
        _id: '$jobType',
        count: { $sum: 1 },
        averageBudget: { $avg: '$budget.amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {},
      byType: jobTypeStats
    }
  });
});

// @desc    Search jobs
// @route   GET /api/jobs/search
// @access  Public
export const searchJobs = asyncHandler(async (req, res, next) => {
  const {
    q,
    page = 1,
    limit = 10,
    filters = {}
  } = req.query;

  if (!q) {
    return next(new ErrorResponse('Search query is required', 400));
  }

  const searchFilter = {
    isActive: true,
    status: 'open',
    $text: { $search: q }
  };

  // Add additional filters
  Object.keys(filters).forEach(key => {
    if (filters[key]) {
      searchFilter[key] = filters[key];
    }
  });

  const skip = (page - 1) * limit;

  const jobs = await Job.find(searchFilter, { score: { $meta: 'textScore' } })
    .populate('postedBy', 'name avatar role')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Job.countDocuments(searchFilter);

  res.status(200).json({
    success: true,
    data: jobs,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / limit),
      total,
      limit: Number(limit)
    }
  });
});
