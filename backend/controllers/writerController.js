// controllers/writerController.js
import ServiceAgreement from '../models/ServiceAgreement.js';
import User from '../models/User.js';
import { chargeInstallment } from '../services/stripeService.js';
import { getIO } from '../socket.js'; // Ensure getIO is correctly imported

export const requestWriter = async (req, res, next) => {
  try {
    const { writerId, projectDetails, installments } = req.body;

    // Verify writer exists and is verified
    const writer = await User.findOne({
      _id: writerId,
      'writerProfile.isVerifiedWriter': true
    });

    if (!writer) {
      return res.status(404).json({ message: 'Verified writer not found' });
    }

    const agreement = await ServiceAgreement.create({
      student: req.user._id,
      writer: writerId,
      projectDetails,
      totalAmount: installments.reduce((sum, i) => sum + i.amount, 0),
      installments: installments.map(i => ({
        amount: i.amount,
        dueDate: i.dueDate
      })),
      progress: 0, // Initialize progress for new agreement
    });

    // Notify writer via Socket.IO
    getIO().to(`user-${writerId}`).emit('newRequest', agreement);
    // Also notify student for confirmation (optional, but good for UX)
    getIO().to(`user-${req.user._id}`).emit('assignmentRequested', agreement);


    res.status(201).json(agreement);
  } catch (err) {
    next(err);
  }
};

export const getWriterAgreements = async (req, res, next) => {
  try {
    const agreements = await ServiceAgreement.find({ writer: req.user._id })
      .populate('student', 'name email avatar') // Populate student details
      .sort('-createdAt');
    res.json(agreements);
  } catch (err) {
    next(err);
  }
};

export const submitWork = async (req, res, next) => {
  try {
    const agreement = await ServiceAgreement.findOne({
      _id: req.params.id,
      writer: req.user._id
    });

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found or you are not the assigned writer' });
    }

    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file for submission');
    }

    // Assuming uploadToS3 is available and returns { Location: fileUrl }
    const s3Data = await import('../utils/upload.js').then(m => m.uploadToS3(req.file, 'deliverables'));

    agreement.deliverables.push({
      fileUrl: s3Data.Location,
      submittedAt: new Date()
    });
    // Optionally update progress to 100% or a specific value upon submission
    agreement.progress = 100; // Assuming submission means 100% completion

    await agreement.save();

    // Notify student via Socket.IO about work submission
    getIO().to(`user-${agreement.student}`).emit('workSubmitted', agreement);

    res.json(agreement);
  } catch (err) {
    next(err);
  }
};

export const completeWork = async (req, res, next) => {
  try {
    const agreement = await ServiceAgreement.findOneAndUpdate(
      {
        _id: req.params.id,
        writer: req.user._id,
        status: { $ne: 'completed' } // Ensure it's not already completed
      },
      { status: 'completed', progress: 100 }, // Set status to completed and progress to 100%
      { new: true }
    );

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found or already completed' });
    }

    // Charge first installment (if any and not already paid)
    // This logic might need to be more sophisticated depending on your payment flow.
    // For example, if installment is due upon completion.
    if (agreement.installments.length > 0 && !agreement.installments[0].isPaid) {
      await chargeInstallment(agreement.installments[0], agreement._id);
      // Note: The actual payment success is handled by Stripe webhook, which updates isPaid.
      // We are just initiating the charge here.
    }

    // Notify student via Socket.IO about agreement completion
    getIO().to(`user-${agreement.student}`).emit('agreementCompleted', agreement);

    res.json(agreement);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update assignment progress by writer
 * @route   PUT /api/writer/agreements/:id/progress
 * @access  Private (Writer)
 */
export const updateAssignmentProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { progress } = req.body; // Expecting a number between 0 and 100

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      res.status(400);
      throw new Error('Progress must be a number between 0 and 100.');
    }

    const agreement = await ServiceAgreement.findOneAndUpdate(
      { _id: id, writer: req.user._id, status: { $ne: 'completed' } }, // Can't update progress if completed
      { progress: progress },
      { new: true }
    ).populate('student', 'name email'); // Populate student to send notification

    if (!agreement) {
      res.status(404);
      throw new Error('Agreement not found or you are not the assigned writer, or it is already completed.');
    }

    // Notify student via Socket.IO about progress update
    getIO().to(`user-${agreement.student._id}`).emit('assignmentProgressUpdate', {
      agreementId: agreement._id,
      progress: agreement.progress,
      title: agreement.projectDetails.title,
      writerName: req.user.name,
    });

    res.status(200).json({ message: 'Progress updated successfully!', agreement });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get writer profile by ID
 * @route   GET /api/writer/:id/profile
 * @access  Public
 */
export const getWriterProfile = async (req, res, next) => {
  try {
    const writer = await User.findOne({
      _id: req.params.id,
      role: 'writer'
    }).select('-password');

    if (!writer) {
      return res.status(404).json({ message: 'Writer not found' });
    }

    res.status(200).json({
      success: true,
      data: writer
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Search writers based on criteria
 * @route   GET /api/writer/search
 * @access  Public
 */
export const searchWriters = async (req, res, next) => {
  try {
    const { subject, rating, availability } = req.query;
    
    let query = { 
      role: 'writer', 
      'writerProfile.isVerifiedWriter': true,
      'writerProfile.isApproved': true,
      'writerProfile.isPublished': true
    };
    
    if (subject) {
      query['writerProfile.subjects'] = { $in: [subject] };
    }
    
    if (rating) {
      query['writerProfile.rating.average'] = { $gte: parseFloat(rating) };
    }
    
    if (availability) {
      query['writerProfile.availability'] = availability;
    }

    const writers = await User.find(query)
      .select('-password')
      .sort({ 'writerProfile.rating.average': -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: writers
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update writer profile
 * @route   PUT /api/writer/profile
 * @access  Private (Writer)
 */
export const updateWriterProfile = async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { writerProfile: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Writer not found' });
    }

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};