// server/socket.js

import { Server } from 'socket.io';
import User from './models/User.js';
import Chat from './models/Chat.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';
import ServiceAgreement from './models/ServiceAgreement.js';
import Order from './models/Order.js';
import { ORDER_STATUS } from './models/constants.js';
import { generateOrderId } from './utils/helpers.js';

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['https://thinqscribe.com', 'https://www.thinqscribe.com', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  // 🔥 BEAST MODE: Enhanced online user tracking with multi-socket support
  const onlineUsers = new Map(); // userId -> Set of socketIds
  const socketToUser = new Map(); // socketId -> userId
  const userLastSeen = new Map(); // userId -> timestamp
  const userHeartbeats = new Map(); // userId -> timestamp

  // Helper function to add user online
  const addUserOnline = (userId, socketId) => {
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socketId);
    socketToUser.set(socketId, userId);
    userLastSeen.set(userId, Date.now());
    userHeartbeats.set(userId, Date.now());
    
    // Notify others that user is online
    io.emit('userOnline', { userId, timestamp: Date.now() });
  };

  // Helper function to remove user socket
  const removeUserSocket = (socketId) => {
    const userId = socketToUser.get(socketId);
    if (userId && onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socketId);
      socketToUser.delete(socketId);
      
      // If no more sockets for this user, mark as offline
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
        userLastSeen.set(userId, Date.now());
        
        // Notify others that user went offline
        io.emit('userOffline', { userId, timestamp: Date.now() });
      }
    }
  };

  // Helper function to check if user is online
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
  };

  // Helper function to get all online user IDs
  const getOnlineUserIds = () => {
    return Array.from(onlineUsers.keys()).filter(userId => onlineUsers.get(userId).size > 0);
  };

  // Heartbeat cleanup - remove stale users every 30 seconds
  const heartbeatInterval = setInterval(() => {
    const now = Date.now();
    const staleThreshold = 90000; // 90 seconds
    
    for (const [userId, lastHeartbeat] of userHeartbeats.entries()) {
      if (now - lastHeartbeat > staleThreshold) {
        // Force remove all sockets for this user
        if (onlineUsers.has(userId)) {
          const socketIds = Array.from(onlineUsers.get(userId));
          socketIds.forEach(socketId => {
            socketToUser.delete(socketId);
          });
          onlineUsers.delete(userId);
          userHeartbeats.delete(userId);
          userLastSeen.set(userId, now);
          
          // Notify others that user went offline
          io.emit('userOffline', { userId, timestamp: now });
        }
      }
    }
  }, 30000);

  io.on('connection', (socket) => {

    // Enhanced connection handling
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
      removeUserSocket(socket.id);
    });

    socket.on('reconnect', (attemptNumber) => {
      // Client reconnected
    });

    // Join user's private room for notifications
    socket.on('joinUserRoom', (userId) => {
      if (userId) {
        socket.join(`user-${userId}`);
        addUserOnline(userId, socket.id);
        socket.emit('joinedUserRoom', { userId, status: 'success', timestamp: Date.now() });
        
        // Send current online users to the newly connected user
        setTimeout(() => {
          const currentOnlineUsers = getOnlineUserIds();
          const onlineStatuses = {};
          currentOnlineUsers.forEach(id => {
            onlineStatuses[id] = true;
          });
          socket.emit('onlineStatuses', onlineStatuses);
        }, 500);
      }
    });

    // Heartbeat handling for persistent online status
    socket.on('heartbeat', (userId) => {
      if (userId) {
        userHeartbeats.set(userId, Date.now());
        socket.emit('heartbeatAck', { timestamp: Date.now() });
      }
    });

    // Manual online status refresh
    socket.on('refreshOnlineStatus', () => {
      const currentOnlineUsers = getOnlineUserIds();
      const onlineStatuses = {};
      currentOnlineUsers.forEach(id => {
        onlineStatuses[id] = true;
      });
      socket.emit('onlineStatuses', onlineStatuses);
    });

    // Writer profile updates for marketplace real-time sync
    socket.on('writerProfileUpdate', (data) => {
      try {
        console.log('📝 Writer profile update received:', data);
        // Broadcast to all connected clients (for marketplace updates)
        socket.broadcast.emit('writerProfileUpdated', {
          writerId: data.writerId,
          updatedFields: data.updatedFields,
          timestamp: Date.now()
        });
        console.log('✅ Writer profile update broadcasted');
      } catch (error) {
        console.error('❌ Error handling writer profile update:', error);
      }
    });

    // Join chat room - CRITICAL FIX
    socket.on('joinChat', (chatId) => {
      if (chatId) {
        socket.join(chatId.toString()); // Join chat room with chatId
        console.log(`💬 Socket ${socket.id} joined chat room: ${chatId}`);
        socket.emit('joinedChat', { chatId, status: 'success' });
      }
    });

    // Leave chat room
    socket.on('leaveChat', (chatId) => {
      if (chatId) {
        socket.leave(chatId.toString());
        console.log(`👋 Socket ${socket.id} left chat room: ${chatId}`);
      }
    });

    // Handle typing indicators - FIXED
    socket.on('typing', ({ chatId, userId, userName }) => {
      if (chatId && userId) {
        console.log(`⌨️ User ${userName} typing in chat ${chatId}`);
        // Broadcast to all others in the chat room
        socket.to(chatId.toString()).emit('typing', { 
          chatId, 
          userId, 
          userName 
        });
      }
    });

    socket.on('stopTyping', ({ chatId, userId }) => {
      if (chatId && userId) {
        console.log(`⏹️ User ${userId} stopped typing in chat ${chatId}`);
        // Broadcast to all others in the chat room
        socket.to(chatId.toString()).emit('stopTyping', { 
          chatId, 
          userId 
        });
      }
    });

    // Handle message broadcasting (from chat controllers) - CRITICAL FIX
    socket.on('broadcastMessage', (data) => {
      const { chatId, message } = data;
      console.log(`📤 Broadcasting message to chat ${chatId}:`, message._id);
      
      // Broadcast to all users in the chat room
      io.to(chatId.toString()).emit('messageBroadcast', {
        chatId,
        message
      });
    });

    // Enhanced message sending with better error handling
    socket.on('sendMessage', async (payload) => {
      try {
        const { chatId, senderId, content, type = 'text', fileUrl, fileName, fileType } = payload;
        console.log(`📝 Sending message for chat ${chatId}`);

        if (!chatId || !senderId || (!content && !fileUrl)) {
          socket.emit('messageError', { 
            message: 'Invalid message data',
            error: 'Missing required fields' 
          });
          return;
        }

        // Create message data
        const messageData = {
          chat: chatId,
          sender: senderId,
          type
        };

        // Add content or file data
        if (fileUrl) {
          messageData.fileUrl = fileUrl;
          messageData.fileName = fileName;
          messageData.fileType = fileType;
          messageData.content = fileName || 'File attachment';
        } else {
          messageData.content = content;
        }

        // Create and save the message
        const message = await Message.create(messageData);

        // Populate sender info
        await message.populate('sender', 'name avatar role');

        // Broadcast to all users in the chat room
        io.to(chatId.toString()).emit('messageBroadcast', {
          chatId,
          message
        });

        // Send success confirmation to sender
        socket.emit('messageSuccess', {
          messageId: message._id,
          chatId,
          timestamp: message.timestamp
        });

        // Find chat and notify other participants
        const chat = await Chat.findById(chatId)
          .populate('participants', 'name role');

        if (chat) {
          const otherParticipants = chat.participants
            .filter(p => p._id.toString() !== senderId);

          for (const participant of otherParticipants) {
            try {
              const senderUser = await User.findById(senderId).select('name');
              const preview = fileUrl ? 
                `📎 ${fileName || 'File attachment'}` : 
                content.slice(0, 50) + (content.length > 50 ? '...' : '');
              
              const notif = await Notification.create({
                user: participant._id,
                type: 'message',
                title: `New message from ${senderUser.name}`,
                message: preview,
                link: `/chat/${participant.role}/${chatId}`,
                read: false
              });
              
              io.to(`user-${participant._id}`).emit('newMessage', {
                chatId,
                message,
                senderName: senderUser.name,
                title: `New message from ${senderUser.name}`,
                content: preview
              });
            } catch (err) {
              console.error('❌ Error creating notification:', err);
            }
          }
        }
      } catch (err) {
        console.error('❌ Error sending message:', err);
        socket.emit('messageError', { 
          message: 'Failed to send message',
          error: err.message 
        });
      }
    });

    // Mark messages as read with better error handling
    socket.on('markMessagesAsRead', async ({ chatId, userId }) => {
      try {
        console.log(`📖 Marking messages as read for chat ${chatId}, user ${userId}`);
        
        const chat = await Chat.findById(chatId);
        if (!chat) {
          console.error('❌ Chat not found for marking messages as read');
          return;
        }

        // Mark unread messages as read
        let updated = false;
        chat.messages.forEach(msg => {
          if (!msg.read && msg.sender.toString() !== userId) {
            msg.read = true;
            updated = true;
          }
        });

        if (updated) {
          await chat.save();
          
          // Notify the sender that their messages were read
          chat.messages.forEach(msg => {
            if (msg.read && msg.sender.toString() !== userId) {
              io.to(`user-${msg.sender}`).emit('messageRead', {
                chatId,
                messageId: msg._id,
                readBy: userId
              });
            }
          });
        }
      } catch (err) {
        console.error('❌ Error marking messages as read:', err);
      }
    });

    // Check online status
    socket.on('checkOnlineStatus', (userIds) => {
      const onlineStatuses = {};
      userIds.forEach(userId => {
        onlineStatuses[userId] = isUserOnline(userId);
      });
      socket.emit('onlineStatuses', onlineStatuses);
    });

    // Get online users list
    socket.on('getOnlineUsers', () => {
      socket.emit('onlineUsersList', getOnlineUserIds());
    });

    // Handle agreement events
    socket.on('agreementCreated', async (data) => {
      try {
        const { agreementId, studentId, writerId } = data;
        
        // Notify the student about the new agreement
        io.to(`user-${studentId}`).emit('newAgreement', {
          agreementId,
          message: 'You have a new service agreement to review'
        });
        
        console.log(`📋 Agreement ${agreementId} created, notified student ${studentId}`);
      } catch (err) {
        console.error('❌ Error handling agreement creation:', err);
      }
    });

    socket.on('agreementAccepted', async (data) => {
      try {
        const { agreementId, studentId, writerId } = data;
        
        // Notify the writer about the accepted agreement
        io.to(`user-${writerId}`).emit('agreementAccepted', {
          agreementId,
          message: 'Your service agreement has been accepted'
        });
        
        console.log(`✅ Agreement ${agreementId} accepted, notified writer ${writerId}`);
      } catch (err) {
        console.error('❌ Error handling agreement acceptance:', err);
      }
    });

    socket.on('agreementCompleted', async (data) => {
      try {
        const { agreementId, studentId, writerId, title, writerName, paidAmount, totalAmount } = data;
        
        // Notify student about completion
        io.to(`user-${studentId}`).emit('agreementCompleted', {
          agreementId,
          title,
          writerName,
          paidAmount,
          totalAmount,
          status: 'completed',
          message: `Your project "${title}" has been completed by ${writerName}`
        });
        
        // Notify writer about successful completion
        io.to(`user-${writerId}`).emit('agreementCompletedByMe', {
          agreementId,
          title,
          paidAmount,
          totalAmount,
          status: 'completed',
          message: `You have successfully completed "${title}"`
        });
        
        // Notify all admins about the completion
        const admins = await User.find({ role: 'admin' }).select('_id');
        admins.forEach(admin => {
          io.to(`user-${admin._id}`).emit('newCompletion', {
            agreementId,
            title,
            writerName,
            amount: totalAmount,
            completedAt: new Date()
          });
        });
        
        console.log(`🎉 Agreement ${agreementId} completed, notified all parties`);
      } catch (err) {
        console.error('❌ Error handling agreement completion:', err);
      }
    });

    // Handle order events
    socket.on('orderCreated', async (data) => {
      try {
        const { orderId, studentId, writerId } = data;
        
        // Notify the writer about the new order
        io.to(`user-${writerId}`).emit('newOrder', {
          orderId,
          message: 'You have a new order'
        });
        
        console.log(`📝 Order ${orderId} created, notified writer ${writerId}`);
      } catch (err) {
        console.error('❌ Error handling order creation:', err);
      }
    });

    socket.on('orderStatusUpdated', async (data) => {
      try {
        const { orderId, status, studentId, writerId } = data;
        
        // Notify the student about the order status update
        io.to(`user-${studentId}`).emit('orderStatusUpdate', {
          orderId,
          status,
          message: `Your order status has been updated to: ${status}`
        });
        
        console.log(`📋 Order ${orderId} status updated to ${status}, notified student ${studentId}`);
      } catch (err) {
        console.error('❌ Error handling order status update:', err);
      }
    });

    // Handle payment events
    socket.on('paymentCompleted', async (data) => {
      try {
        const { orderId, studentId, writerId, amount } = data;
        
        // Notify both parties about the completed payment
        io.to(`user-${studentId}`).emit('paymentConfirmed', {
          orderId,
          amount,
          message: 'Your payment has been confirmed'
        });
        
        io.to(`user-${writerId}`).emit('paymentReceived', {
          orderId,
          amount,
          message: 'Payment received for your order'
        });
        
        console.log(`💰 Payment completed for order ${orderId}, notified both parties`);
      } catch (err) {
        console.error('❌ Error handling payment completion:', err);
      }
    });

    // Handle notifications
    socket.on('sendNotification', async (data) => {
      try {
        const { userId, type, title, message, link } = data;
        
        // Create notification in database
        const notification = await Notification.create({
          user: userId,
          type,
          title,
          message,
          link,
          read: false
        });
        
        // Send real-time notification
        io.to(`user-${userId}`).emit('newNotification', {
          id: notification._id,
          type,
          title,
          message,
          link,
          timestamp: notification.createdAt
        });
        
        console.log(`🔔 Notification sent to user ${userId}: ${title}`);
      } catch (err) {
        console.error('❌ Error sending notification:', err);
      }
    });

    // Handle general events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle user activity tracking
    socket.on('userActivity', ({ userId, activity }) => {
      console.log(`👤 User ${userId} activity: ${activity}`);
      // You can track user activities here if needed
    });

    // Video call signaling
    socket.on('joinVideoCall', (data) => {
      const { chatId, userId, userName } = data;
      socket.join(`video-call-${chatId}`);
      
      // Notify other participants in the chat
      socket.to(`video-call-${chatId}`).emit('userJoinedVideoCall', {
        userId,
        userName,
        chatId
      });
      
      console.log(`User ${userName} (${userId}) joined video call in chat ${chatId}`);
    });

    socket.on('leaveVideoCall', (data) => {
      const { chatId, userId, userName } = data;
      socket.leave(`video-call-${chatId}`);
      
      // Notify other participants
      socket.to(`video-call-${chatId}`).emit('userLeftVideoCall', {
        userId,
        userName,
        chatId
      });
      
      console.log(`User ${userName} (${userId}) left video call in chat ${chatId}`);
    });

    // Incoming call notifications
    socket.on('incomingCall', (data) => {
      const { chatId, callerId, callerName, targetUserId } = data;
      
      // Send notification to the target user
      io.to(`user-${targetUserId}`).emit('incomingCall', {
        chatId,
        callerId,
        callerName,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Incoming call from ${callerName} (${callerId}) to user ${targetUserId} in chat ${chatId}`);
    });

    socket.on('callAccepted', (data) => {
      const { chatId, callerId, targetUserId, targetUserName } = data;
      
      // Notify the caller that the call was accepted
      io.to(`user-${callerId}`).emit('callAccepted', {
        chatId,
        targetUserId,
        targetUserName,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Call accepted by ${targetUserName} (${targetUserId}) for caller ${callerId} in chat ${chatId}`);
    });

    socket.on('callRejected', (data) => {
      const { chatId, callerId, targetUserId, targetUserName } = data;
      
      // Notify the caller that the call was rejected
      io.to(`user-${callerId}`).emit('callRejected', {
        chatId,
        targetUserId,
        targetUserName,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Call rejected by ${targetUserName} (${targetUserId}) for caller ${callerId} in chat ${chatId}`);
    });

    socket.on('callEnded', (data) => {
      const { chatId, userId, userName, callDuration = 0 } = data;
      
      // Leave the video call room
      socket.leave(`video-call-${chatId}`);
      
      // Broadcast to all users in the video call room
      socket.to(`video-call-${chatId}`).emit('callEnded', {
        userId,
        userName,
        chatId,
        callDuration
      });
      
      // Also broadcast to the chat room for duration message
      if (callDuration > 0) {
        io.to(chatId.toString()).emit('callCompleted', {
          chatId,
          endedBy: userName,
          duration: callDuration,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`Call ended by ${userName} in chat ${chatId}, duration: ${callDuration}s`);
    });

    // WebRTC signaling handlers
    socket.on('offer', (data) => {
      const { chatId, offer, fromUserId, toUserId } = data;
      
      if (toUserId) {
        // Send to specific user
        io.to(`user-${toUserId}`).emit('offer', {
          chatId,
          offer,
          fromUserId
        });
      } else {
        // Broadcast to all users in the video call room
        socket.to(`video-call-${chatId}`).emit('offer', {
          chatId,
          offer,
          fromUserId
        });
      }
      
      console.log(`WebRTC offer sent from ${fromUserId} in chat ${chatId}`);
    });

    socket.on('answer', (data) => {
      const { chatId, answer, fromUserId, toUserId } = data;
      
      if (toUserId) {
        // Send to specific user
        io.to(`user-${toUserId}`).emit('answer', {
          chatId,
          answer,
          fromUserId
        });
      } else {
        // Broadcast to all users in the video call room
        socket.to(`video-call-${chatId}`).emit('answer', {
          chatId,
          answer,
          fromUserId
        });
      }
      
      console.log(`WebRTC answer sent from ${fromUserId} in chat ${chatId}`);
    });

    socket.on('iceCandidate', (data) => {
      const { chatId, candidate, fromUserId, toUserId } = data;
      
      if (toUserId) {
        // Send to specific user
        io.to(`user-${toUserId}`).emit('iceCandidate', {
          chatId,
          candidate,
          fromUserId
        });
      } else {
        // Broadcast to all users in the video call room
        socket.to(`video-call-${chatId}`).emit('iceCandidate', {
          chatId,
          candidate,
          fromUserId
        });
      }
      
      console.log(`ICE candidate sent from ${fromUserId} in chat ${chatId}`);
    });

    // WebRTC Audio Call Events
    socket.on('webrtc:call-request', (data) => {
      const { to, from, fromName, toName, callId, chatId, callType, timestamp } = data;
      console.log(`📞 WebRTC: Call request from ${fromName} to ${toName}`);
      
      // Send call request to target user IMMEDIATELY with minimal processing
      io.to(`user-${to}`).emit('webrtc:call-request', {
        from,
        fromName,
        toName,
        callId,
        chatId,
        callType,
        timestamp: timestamp || Date.now()
      });
    });

    socket.on('webrtc:call-accepted', (data) => {
      const { to, from, callId, timestamp } = data;
      
      // Notify caller that call was accepted IMMEDIATELY
      io.to(`user-${to}`).emit('webrtc:call-accepted', {
        from,
        callId,
        timestamp: timestamp || Date.now()
      });
    });

    socket.on('webrtc:call-rejected', (data) => {
      const { to, from, callId } = data;
      console.log(`❌ WebRTC: Call rejected - ID: ${callId}`);
      
      // Notify caller that call was rejected
      io.to(`user-${to}`).emit('webrtc:call-rejected', {
        from,
        callId,
        timestamp: Date.now()
      });
    });

    socket.on('webrtc:call-ended', (data) => {
      const { from, callId, duration, chatId, toUserId, fromName, toName } = data;
      console.log(`📞 WebRTC: Call ended - ID: ${callId}, Duration: ${duration}s`);
      
      // Broadcast call ended to all participants
      socket.broadcast.emit('webrtc:call-ended', {
        from,
        callId,
        duration,
        timestamp: Date.now()
      });

      // Send call duration message to chat if we have the required data
      if (chatId && duration && toUserId && fromName) {
        handleCallDurationMessage(chatId, from, toUserId, duration, fromName, toName);
      }
    });

    // Handle call duration messages
    const handleCallDurationMessage = async (chatId, fromUserId, toUserId, duration, fromName, toName) => {
      try {
        const formatDuration = (seconds) => {
          if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return secs > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${mins} minute${mins === 1 ? '' : 's'}`;
        };

        const durationText = formatDuration(duration);
        const messageContent = `📞 Audio call • ${durationText}`;

        // Use the already imported Chat model

        // Find the chat and add call duration message
        const chat = await Chat.findById(chatId);
        if (!chat) {
          console.error('Chat not found:', chatId);
          return;
        }

        // Create call message
        const newMessage = {
          sender: fromUserId,
          content: messageContent,
          type: 'call',
          callDuration: duration,
          timestamp: new Date(),
          read: false
        };

        // Add message to chat
        chat.messages.push(newMessage);
        chat.updatedAt = new Date();
        await chat.save();

        // Get the saved message with populated sender
        await chat.populate('messages.sender', 'name avatar role');
        const message = chat.messages[chat.messages.length - 1];

        // Broadcast to chat room
        io.to(chatId.toString()).emit('messageBroadcast', {
          chatId,
          message
        });

        console.log(`📞 Call duration message sent: ${messageContent}`);
      } catch (error) {
        console.error('Error sending call duration message:', error);
      }
    };

    socket.on('webrtc:signal', (data) => {
      const { to, signal, callId, from, timestamp } = data;
      
      // Forward signaling data to target user IMMEDIATELY (minimal logging for speed)
      io.to(`user-${to}`).emit('webrtc:signal', {
        from: from || socket.userId,
        signal,
        callId,
        timestamp: timestamp || Date.now()
      });
    });

    // ==========================================
    // JOB POSTING REAL-TIME EVENTS
    // ==========================================

    // Handle job view tracking
    socket.on('jobViewed', async (data) => {
      try {
        const { jobId, userId } = data;
        console.log(`👀 Job ${jobId} viewed by user ${userId}`);
        
        // Import Job model dynamically to avoid circular dependency
        const { default: Job } = await import('./models/Job.js');
        const job = await Job.findById(jobId);
        
        if (job) {
          await job.addView(userId);
          console.log(`✅ Job view tracked for job ${jobId}`);
        }
      } catch (error) {
        console.error('❌ Error tracking job view:', error);
      }
    });

    // Handle job application notifications
    socket.on('jobApplicationSubmitted', (data) => {
      const { jobId, writerId, writerName, jobTitle } = data;
      console.log(`📝 Job application submitted for job ${jobId} by ${writerName}`);
      
      // Notify job poster about new application
      socket.broadcast.emit('newJobApplication', {
        jobId,
        writerId,
        writerName,
        jobTitle,
        message: `New application from ${writerName}`,
        timestamp: Date.now()
      });
    });

    // Handle job status updates
    socket.on('jobStatusUpdated', (data) => {
      const { jobId, status, updatedBy, jobTitle } = data;
      console.log(`📋 Job ${jobId} status updated to ${status} by ${updatedBy}`);
      
      // Broadcast job status update to all connected users
      io.emit('jobStatusChanged', {
        jobId,
        status,
        updatedBy,
        jobTitle,
        message: `Job "${jobTitle}" status updated to ${status}`,
        timestamp: Date.now()
      });
    });

    // Handle job assignment notifications
    socket.on('jobAssigned', (data) => {
      const { jobId, writerId, studentId, jobTitle } = data;
      console.log(`✅ Job ${jobId} assigned to writer ${writerId}`);
      
      // Notify the assigned writer
      io.to(`user-${writerId}`).emit('jobAssignedToYou', {
        jobId,
        jobTitle,
        message: `You have been assigned to job: ${jobTitle}`,
        timestamp: Date.now()
      });
      
      // Notify the student
      io.to(`user-${studentId}`).emit('jobAssignedToWriter', {
        jobId,
        jobTitle,
        message: `Your job "${jobTitle}" has been assigned to a writer`,
        timestamp: Date.now()
      });
    });

    // Handle job completion notifications
    socket.on('jobCompleted', (data) => {
      const { jobId, writerId, studentId, jobTitle, completedAt } = data;
      console.log(`🎉 Job ${jobId} completed by writer ${writerId}`);
      
      // Notify the student
      io.to(`user-${studentId}`).emit('jobCompleted', {
        jobId,
        jobTitle,
        writerId,
        message: `Your job "${jobTitle}" has been completed!`,
        completedAt,
        timestamp: Date.now()
      });
      
      // Notify the writer
      io.to(`user-${writerId}`).emit('jobCompletedByYou', {
        jobId,
        jobTitle,
        message: `You have successfully completed: ${jobTitle}`,
        completedAt,
        timestamp: Date.now()
      });
    });

    // Handle job deadline reminders
    socket.on('jobDeadlineReminder', (data) => {
      const { jobId, deadline, jobTitle, userIds } = data;
      console.log(`⏰ Job deadline reminder for job ${jobId}`);
      
      // Send reminder to specific users
      userIds.forEach(userId => {
        io.to(`user-${userId}`).emit('jobDeadlineReminder', {
          jobId,
          jobTitle,
          deadline,
          message: `Reminder: Job "${jobTitle}" deadline is approaching`,
          timestamp: Date.now()
        });
      });
    });

    // Handle job search/filter updates
    socket.on('jobSearchPerformed', (data) => {
      const { searchQuery, filters, resultsCount, userId } = data;
      console.log(`🔍 Job search performed by user ${userId}: "${searchQuery}"`);
      
      // Could be used for analytics or real-time search suggestions
      socket.broadcast.emit('jobSearchActivity', {
        searchQuery,
        filters,
        resultsCount,
        userId,
        timestamp: Date.now()
      });
    });

    // Handle job bookmark/favorite
    socket.on('jobBookmarked', (data) => {
      const { jobId, userId, action } = data; // action: 'bookmark' or 'unbookmark'
      console.log(`⭐ Job ${jobId} ${action}ed by user ${userId}`);
      
      // Notify job poster about bookmark activity (optional)
      socket.broadcast.emit('jobBookmarkActivity', {
        jobId,
        userId,
        action,
        timestamp: Date.now()
      });
    });

    // Handle job sharing
    socket.on('jobShared', (data) => {
      const { jobId, sharedBy, sharedWith, jobTitle } = data;
      console.log(`📤 Job ${jobId} shared by ${sharedBy} with ${sharedWith}`);
      
      // Notify the recipient
      if (sharedWith) {
        io.to(`user-${sharedWith}`).emit('jobSharedWithYou', {
          jobId,
          jobTitle,
          sharedBy,
          message: `Job "${jobTitle}" has been shared with you`,
          timestamp: Date.now()
        });
      }
    });

    // Handle job feedback/rating
    socket.on('jobFeedbackSubmitted', (data) => {
      const { jobId, writerId, studentId, rating, feedback } = data;
      console.log(`⭐ Job feedback submitted for job ${jobId}`);
      
      // Notify the writer about feedback
      io.to(`user-${writerId}`).emit('jobFeedbackReceived', {
        jobId,
        rating,
        feedback,
        message: 'You have received feedback for your completed job',
        timestamp: Date.now()
      });
      
      // Notify the student
      io.to(`user-${studentId}`).emit('jobFeedbackSubmitted', {
        jobId,
        message: 'Your feedback has been submitted',
        timestamp: Date.now()
      });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export { initSocket, getIO };
