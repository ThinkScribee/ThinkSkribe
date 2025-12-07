import ServiceAgreement from '../models/ServiceAgreement.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Chat from '../models/Chat.js';
import currencyService from '../services/currencyService.js';

/**
 * @desc    Get writer dashboard data
 * @route   GET /api/writer/dashboard
 * @access  Private (Writer)
 */
export const getWriterDashboard = async (req, res, next) => {
  try {
    const writerId = req.user._id;

    // Fetch all agreements for this writer
    const agreements = await ServiceAgreement.find({ writer: writerId })
      .populate('student', 'name email avatar')
      .sort({ createdAt: -1 });

    console.log(`Found ${agreements.length} agreements for writer ${writerId}`);

    // Fix paidAmount calculation for each agreement
    for (const agreement of agreements) {
      let calculatedPaidAmount = 0;
      
      if (agreement.installments && agreement.installments.length > 0) {
        // Calculate based on installments
        calculatedPaidAmount = agreement.installments.reduce((sum, installment) => {
          if (installment.status === 'paid' || installment.status === 'processing') {
            return sum + (installment.amount || 0);
          }
          return sum;
        }, 0);
      }
      
      // Update the agreement if paidAmount is incorrect
      if (Math.abs(agreement.paidAmount - calculatedPaidAmount) > 0.01) {
        console.log(`Fixing paidAmount for agreement ${agreement._id}: ${agreement.paidAmount} -> ${calculatedPaidAmount}`);
        agreement.paidAmount = calculatedPaidAmount;
        await agreement.save();
      }
    }

    // Calculate TOTAL EARNINGS from all paid amounts in agreements - converted to USD
    let totalEarningsFromAgreements = 0;
    for (const agreement of agreements) {
      if (agreement.paidAmount > 0) {
        // Calculate writer's share (100% - platform fee removed)
        let writerShare = agreement.paidAmount * 1.0; // 100% writer share
        
        // Keep original currency (Naira) - no conversion needed
        // All amounts are already in Naira
        
        totalEarningsFromAgreements += writerShare;
      }
    }

    // Also get payments from Payment model as backup - converted to USD
    const payments = await Payment.find({ writer: writerId, status: { $in: ['completed', 'succeeded', 'paid'] } });
    let totalEarningsFromPayments = 0;
    for (const payment of payments) {
      let amount = payment.writerAmount || payment.amount || 0;
      
      // Keep original currency (Naira) - no conversion needed
      // All amounts are already in Naira
      
      totalEarningsFromPayments += amount;
    }

    // Use the higher of the two calculations to ensure accuracy
    const totalEarnings = Math.max(totalEarningsFromAgreements, totalEarningsFromPayments);

    console.log(`💰 Total earnings calculation:
      - From agreements: $${totalEarningsFromAgreements.toFixed(2)}
      - From payments: $${totalEarningsFromPayments.toFixed(2)}
      - Final total: $${totalEarnings.toFixed(2)}`);

    // PENDING AMOUNT: sum of unpaid amounts from pending and active agreements - converted to USD
    let pendingAmount = 0;
    for (const agreement of agreements) {
      if (agreement.status === 'pending' || agreement.status === 'active') {
        const unpaid = (agreement.totalAmount || 0) - (agreement.paidAmount || 0);
        if (unpaid > 0.005) {
          // Calculate writer's potential earnings (100% - platform fee removed)
          let writerPendingShare = unpaid * 1.0; // 100% writer share
          
          // Keep original currency (Naira) - no conversion needed
          // All amounts are already in Naira
          
          pendingAmount += writerPendingShare;
        }
      }
    }

    let activeProjects = 0, completedProjects = 0, pendingProjects = 0;
    agreements.forEach(a => {
      if (a.status === 'active') activeProjects++;
      if (a.status === 'completed') completedProjects++;
      if (a.status === 'pending') pendingProjects++;
    });

    // Monthly earnings - converted to USD
    const currentMonth = new Date(); 
    currentMonth.setDate(1); 
    currentMonth.setHours(0,0,0,0);
    
    let monthlyEarnings = 0;
    for (const agreement of agreements) {
      if (agreement.paidAmount > 0 && new Date(agreement.updatedAt) >= currentMonth) {
        let writerMonthlyShare = agreement.paidAmount * 1.0; // 100% writer share
        
        // Keep original currency (Naira) - no conversion needed
        // All amounts are already in Naira
        
        monthlyEarnings += writerMonthlyShare;
      }
    }

    // Available balance: total earnings available for withdrawal (platform fee removed)
    const availableBalance = totalEarnings; // Writers get full amount

    // Writer info
    const writerUser = await User.findById(writerId).select('writerProfile email name');
    const writerRating = writerUser?.writerProfile?.rating?.average || 4.5;
    const writerReviewsCount = writerUser?.writerProfile?.rating?.count || 0;

    // Ensure all active agreements have chat IDs and create chats if needed
    const activeAgreementsList = [];
    const pendingAgreementsList = agreements.filter(a => a.status === 'pending');
    
    for (const agreement of agreements.filter(a => a.status === 'active')) {
      let chatId = agreement.chatId;
      
      // If no chatId, create or find existing chat
      if (!chatId) {
        try {
          let existingChat = await Chat.findOne({ 
            $or: [
              { agreement: agreement._id },
              { student: agreement.student._id, writer: writerId }
            ]
          });
          
          if (!existingChat) {
            // Create new chat
            existingChat = await Chat.create({
              agreement: agreement._id,
              student: agreement.student._id,
              writer: writerId,
              isActive: true,
              messages: []
            });
            console.log(`Created new chat ${existingChat._id} for agreement ${agreement._id}`);
          }
          
          chatId = existingChat._id;
          
          // Update agreement with chatId
          await ServiceAgreement.findByIdAndUpdate(agreement._id, { chatId });
          
        } catch (chatError) {
          console.warn(`Warning: Could not create/find chat for agreement ${agreement._id}:`, chatError.message);
          chatId = agreement._id; // Fallback to agreement ID
        }
      }
      
      activeAgreementsList.push({
        ...agreement.toObject(),
        chatId
      });
    }
    
    const completedAgreementsList = agreements.filter(a => a.status === 'completed');

    const totalAssignments = agreements.length;
    const deliveryRate = totalAssignments > 0 ? ((completedProjects / totalAssignments) * 100).toFixed(1) : 0;
    const successRate = deliveryRate;

    // Recent payment history
    const recentPayments = await Payment.find({ writer: writerId, status: { $in: ['completed', 'succeeded', 'paid'] } })
      .populate('agreement', 'projectDetails')
      .sort({ paymentDate: -1 })
      .limit(10);

    // Response
    const dashboardData = {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      availableBalance: Math.round(availableBalance * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      monthlyEarnings: Math.round(monthlyEarnings * 100) / 100,
      // Currency information - all amounts are converted to USD
      currency: {
        code: 'usd',
        symbol: '$',
        name: 'US Dollar',
        note: 'All earnings are converted to USD for consistent dashboard display'
      },
      totalProjects: totalAssignments,
      pendingProjects,
      activeProjects,
      completedProjects,
      assignmentsInProgress: activeProjects,
      assignmentsInProgressList: activeAgreementsList,
      completedAssignmentsCount: completedProjects,
      availableAssignments: pendingAgreementsList,
      writerRating: Math.round(writerRating * 10) / 10,
      writerReviewsCount,
      deliveryRate: parseFloat(deliveryRate),
      successRate: parseFloat(successRate),
      responseRate: 95, // Default response rate
      notifications: [],
      unreadMessagesCount: 0,
      recentPayments,
      recentCompletedAssignments: completedAgreementsList,
      disputesCount: 0,
      currentBalance: Math.round(availableBalance * 100) / 100,
      payoutHistory: recentPayments.slice(0, 5),
      writerEmail: writerUser?.email,
      writerName: writerUser?.name
    };

    res.status(200).json(dashboardData);

  } catch (err) {
    console.error('❌ Error fetching writer dashboard data:', err);
    next(err);
  }
};


/**
 * @desc    Accept a pending service agreement
 * @route   PUT /api/writer/agreements/:id/accept
 * @access  Private (Writer)
 */
export const acceptServiceAgreement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const writerId = req.user._id;

    const agreement = await ServiceAgreement.findOneAndUpdate(
      { _id: id, writer: writerId, status: 'pending' },
      { status: 'active' },
      { new: true }
    ).populate('student', 'name email'); // Populate student to send notification

    if (!agreement) {
      res.status(404);
      throw new Error('Agreement not found or cannot be accepted (e.g., already active/completed).');
    }

    // Create or update chat for this agreement
    try {
      let existingChat = await Chat.findOne({ 
        $or: [
          { agreement: agreement._id },
          { student: agreement.student._id, writer: writerId }
        ]
      });
      
      if (!existingChat) {
        const newChat = await Chat.create({
          agreement: agreement._id,
          student: agreement.student._id,
          writer: writerId,
          isActive: true,
          messages: []
        });
        
        // Update agreement with chatId
        await ServiceAgreement.findByIdAndUpdate(agreement._id, { chatId: newChat._id });
        
        console.log(`Created new chat ${newChat._id} for accepted agreement ${agreement._id}`);
      } else {
        // Update agreement with existing chatId
        await ServiceAgreement.findByIdAndUpdate(agreement._id, { chatId: existingChat._id });
      }
    } catch (chatError) {
      console.warn('Warning: Could not create chat for accepted agreement:', chatError.message);
    }

    const { getIO } = await import('../socket.js'); // Dynamically import getIO
    getIO().to(`user-${agreement.student._id}`).emit('agreementAccepted', {
      agreementId: agreement._id,
      title: agreement.projectDetails.title,
      writerName: req.user.name,
      status: agreement.status,
    });

    res.status(200).json({ message: 'Agreement accepted successfully!', agreement });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Complete a service agreement (Writer)
 * @route   PUT /api/writer/agreements/:id/complete
 * @access  Private (Writer)
 */
export const completeServiceAgreement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const writerId = req.user._id;

    console.log('🔄 [WriterDashboard] Completing agreement:', id, 'by writer:', writerId);

    // First, let's check if the agreement exists and get its current state
    const existingAgreement = await ServiceAgreement.findById(id);
    if (!existingAgreement) {
      console.error('❌ [WriterDashboard] Agreement not found:', id);
      res.status(404);
      throw new Error('Agreement not found.');
    }

    console.log('📋 [WriterDashboard] Agreement details:');
    console.log('   - Status:', existingAgreement.status);
    console.log('   - Writer:', existingAgreement.writer);
    console.log('   - Expected Writer:', writerId);
    console.log('   - Progress:', existingAgreement.progress);

    // Check if writer matches
    if (existingAgreement.writer.toString() !== writerId.toString()) {
      console.error('❌ [WriterDashboard] Writer ID mismatch');
      res.status(403);
      throw new Error('You are not the assigned writer for this agreement.');
    }

    // Check if agreement is active
    if (existingAgreement.status !== 'active') {
      console.error('❌ [WriterDashboard] Agreement is not active. Current status:', existingAgreement.status);
      res.status(400);
      throw new Error(`Agreement cannot be completed. Current status: ${existingAgreement.status}. Only active agreements can be completed.`);
    }

    const agreement = await ServiceAgreement.findOneAndUpdate(
      { _id: id, writer: writerId, status: 'active' },
      { 
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      },
      { new: true }
    ).populate('student', 'name email');

    if (!agreement) {
      res.status(404);
      throw new Error('Agreement not found, not active, or you are not the assigned writer.');
    }

    // 🔥 NEW: Auto-complete payment when agreement is completed
    let totalPaid = 0;
    let hasUpdates = false;
    
    if (agreement.installments && agreement.installments.length > 0) {
      agreement.installments.forEach(installment => {
        if (installment.status === 'pending' || installment.status === 'processing') {
          installment.status = 'paid';
          installment.isPaid = true;
          installment.paymentDate = new Date();
          hasUpdates = true;
        }
        if (installment.status === 'paid') {
          totalPaid += installment.amount;
        }
      });
      
      if (hasUpdates) {
        agreement.paidAmount = totalPaid;
        agreement.paymentStatus = 'completed';
        await agreement.save();
        console.log('💰 [WriterDashboard] Payment updated: paidAmount =', totalPaid);
      }
    } else {
      agreement.paidAmount = agreement.totalAmount;
      agreement.paymentStatus = 'completed';
      await agreement.save();
      console.log('💰 [WriterDashboard] Full payment marked: paidAmount =', agreement.totalAmount);
    }

    console.log('✅ [WriterDashboard] Agreement completed successfully:', agreement._id);

    // Notify all relevant parties through socket
    try {
      const { getIO } = await import('../socket.js');
      const io = getIO();
      
      // Notify student about completion
      io.to(`user-${agreement.student._id}`).emit('agreementCompleted', {
        agreementId: agreement._id,
        title: agreement.projectDetails.title,
        writerName: req.user.name,
        message: `Your project "${agreement.projectDetails.title}" has been completed by ${req.user.name}`,
        paidAmount: agreement.paidAmount,
        totalAmount: agreement.totalAmount,
        status: 'completed'
      });

      // Notify writer about successful completion
      io.to(`user-${writerId}`).emit('agreementCompletedByMe', {
        agreementId: agreement._id,
        title: agreement.projectDetails.title,
        message: `You have successfully completed "${agreement.projectDetails.title}"`,
        paidAmount: agreement.paidAmount,
        totalAmount: agreement.totalAmount,
        status: 'completed'
      });

      // Notify admins about new completion
      const admins = await User.find({ role: 'admin' }).select('_id');
      admins.forEach(admin => {
        io.to(`user-${admin._id}`).emit('newCompletion', {
          agreementId: agreement._id,
          title: agreement.projectDetails.title,
          writerName: req.user.name,
          studentName: agreement.student.name,
          amount: agreement.totalAmount,
          completedAt: agreement.completedAt
        });
      });

      // General agreement update event for all dashboards
      io.emit('agreementUpdated', {
        agreementId: agreement._id,
        status: 'completed',
        type: 'completion',
        writerName: req.user.name,
        studentId: agreement.student._id,
        writerId: writerId
      });

      console.log('📡 [WriterDashboard] Socket notifications sent successfully');
      console.log(`   - Student notified: user-${agreement.student._id}`);
      console.log(`   - Writer notified: user-${writerId}`);
      console.log(`   - ${admins.length} admins notified`);
    } catch (socketError) {
      console.error('⚠️ [WriterDashboard] Socket notification failed:', socketError);
    }

    res.status(200).json({ 
      message: 'Agreement completed successfully!', 
      agreement 
    });
  } catch (err) {
    console.error('❌ [WriterDashboard] Error completing agreement:', err);
    next(err);
  }
}; 
