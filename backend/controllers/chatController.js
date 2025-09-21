// server/controllers/chatController.js
import { getUserLocationData } from '../middlewares/locationMiddleware.js';
import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendImmediateNotification } from '../services/unreadMessageService.js';
import { getIO } from '../socket.js';
import { uploadToS3 } from '../utils/upload.js'; // 🔧 S3 helper

// ────────────────────────────────────────────────────────────────────────────────
// 1) Start a new chat between two users (or return existing)
// ────────────────────────────────────────────────────────────────────────────────
export const startChat = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Check if a chat already exists between these two users
    const existingChat = await Chat.findOne({
      participants: { $all: [req.user._id, participantId] }
    }).populate('participants', 'name email avatar role');

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create a new chat document
    const chat = await Chat.create({
      participants: [req.user._id, participantId],
      createdBy: req.user._id,
      messages: []
    });

    // Populate participants before returning
    const populatedChat = await Chat.findById(chat._id).populate(
      'participants',
      'name email avatar role location'
    );

    // Notify the other user that a new chat has been started
    getIO().to(`user-${participantId}`).emit('newChat', {
      chat: populatedChat,
      message: `${req.user.name} started a chat with you`
    });

    res.status(201).json(populatedChat);
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────────────────────────
// 2) Retrieve all chats for the authenticated user
// ────────────────────────────────────────────────────────────────────────────────
export const getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name email avatar role location')
      .populate('messages.sender', 'name avatar location')
      .sort('-updatedAt');

    // Enhance each chat with formatted location data and unread counts
    const enhancedChats = chats.map(chat => {
      const chatObj = chat.toObject();
      
      // Calculate unread count for this user
      const unreadCount = chatObj.messages.filter(msg => 
        !msg.read && msg.sender._id.toString() !== req.user._id.toString()
      ).length;
      
      // Add unread count to chat object
      chatObj.unreadCount = unreadCount;
      
      // Add formatted location data for participants
      chatObj.participants = chatObj.participants.map(participant => ({
        ...participant,
        locationData: getUserLocationData(participant)
      }));

      // Add formatted location data for message senders
      chatObj.messages = chatObj.messages.map(message => ({
        ...message,
        sender: {
          ...message.sender,
          locationData: getUserLocationData(message.sender)
        }
      }));

      return chatObj;
    });

    // Debug logging for unread counts
    console.log(`📊 [Backend] getChats for user ${req.user._id}:`, 
      enhancedChats.map(chat => ({ 
        chatId: chat._id, 
        unreadCount: chat.unreadCount,
        lastMessage: chat.messages[chat.messages.length - 1]?.content?.substring(0, 30) + '...'
      }))
    );

    res.json(enhancedChats);
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────────────────────────
// 3) Retrieve all messages in a chat, marking unread as read, and return
//    each message with optional "replyTo" data manually included.
// ────────────────────────────────────────────────────────────────────────────────
export const getChatMessages = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('messages.sender', 'name avatar location')
      .populate('participants', 'name email avatar role location');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Ensure the requester is a participant
    const isParticipant = chat.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark any unread messages (sent by others) as read
    let messagesMarkedAsRead = false;
    chat.messages.forEach((msg) => {
      if (
        msg.sender._id.toString() !== req.user._id.toString() &&
        msg.read === false
      ) {
        msg.read = true;
        messagesMarkedAsRead = true;
      }
    });

    if (messagesMarkedAsRead) {
      await chat.save();
      getIO().to(`user-${req.user._id}`).emit('messagesRead', {
        chatId: chat._id,
        userId: req.user._id
      });
      getIO().to(`user-${req.user._id}`).emit('getUnreadCount', req.user._id);
    }

    // Build an array of message payloads, each including replyTo if present
    const messagesPayload = chat.messages.map((msg) => {
      const base = {
        _id: msg._id,
        sender: {
          _id: msg.sender._id,
          name: msg.sender.name,
          avatar: msg.sender.avatar
        },
        content: msg.content,
        timestamp: msg.timestamp,
        read: msg.read,
        replyTo: null,
        // Include file metadata if present
        fileUrl: msg.fileUrl || null,
        fileName: msg.fileName || null,
        fileType: msg.fileType || null,
        voiceDuration: msg.voiceDuration || null
      };

      if (msg.replyTo) {
        // Find the sub-document being replied to in the same chat.messages array
        const repliedMsg = chat.messages.id(msg.replyTo);
        if (repliedMsg && repliedMsg.sender) {
          base.replyTo = {
            _id: repliedMsg._id,
            content: repliedMsg.content,
            timestamp: repliedMsg.timestamp,
            sender: {
              _id: repliedMsg.sender._id,
              name: repliedMsg.sender.name,
              avatar: repliedMsg.sender.avatar
            }
          };
        }
      }
      return base;
    });

    // Enhance messages with location data
    const enhancedMessagesPayload = messagesPayload.map(message => ({
      ...message,
      sender: {
        ...message.sender,
        locationData: getUserLocationData(message.sender)
      },
      replyTo: message.replyTo ? {
        ...message.replyTo,
        sender: {
          ...message.replyTo.sender,
          locationData: getUserLocationData(message.replyTo.sender)
        }
      } : null
    }));

    res.json(enhancedMessagesPayload);
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────────────────────────
// 4) Send a new message (HTTP endpoint). Accepts optional replyTo. Returns
//    the newly created message payload (including manual replyTo data).
export const sendMessage = async (req, res, next) => {
  try {
    const { chatId, content, replyTo } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const chat = await Chat.findById(chatId).populate(
      'participants',
      'name email avatar role'
    );
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const isParticipant = chat.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create new message sub-document, including optional replyTo
    const newMessageSubdoc = {
      sender: req.user._id,
      content: content.trim(),
      timestamp: new Date(),
      read: false,
      replyTo: replyTo || null
    };

    chat.messages.push(newMessageSubdoc);
    chat.updatedAt = new Date();
    await chat.save();

    // Populate sender info so we can build the payload
    await chat.populate({ path: 'messages.sender', select: 'name avatar location' });
    const savedSubdoc = chat.messages[chat.messages.length - 1];

    // Build the payload (including manual replyTo if needed)
    const payload = {
      _id: savedSubdoc._id,
      sender: {
        _id: savedSubdoc.sender._id,
        name: savedSubdoc.sender.name,
        avatar: savedSubdoc.sender.avatar,
        locationData: getUserLocationData(savedSubdoc.sender)
      },
      content: savedSubdoc.content,
      timestamp: savedSubdoc.timestamp,
      read: savedSubdoc.read,
      replyTo: null
    };
    if (savedSubdoc.replyTo) {
      const repliedMsg = chat.messages.id(savedSubdoc.replyTo);
      if (repliedMsg && repliedMsg.sender) {
        payload.replyTo = {
          _id: repliedMsg._id,
          content: repliedMsg.content,
          timestamp: repliedMsg.timestamp,
          sender: {
            _id: repliedMsg.sender._id,
            name: repliedMsg.sender.name,
            avatar: repliedMsg.sender.avatar,
            locationData: getUserLocationData(repliedMsg.sender)
          }
        };
      }
    }

    // Notify the other participant (via socket)
    const recipient = chat.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );
    if (recipient) {
      const notification = new Notification({
        user: recipient._id,
        type: 'message',
        title: `New message from ${req.user.name}`,
        message: payload.content.substring(0, 50) +
          (payload.content.length > 50 ? '...' : ''),
        link: `/chat/${recipient.role || 'user'}/${chat._id}`,
        read: false
      });
      await notification.save();

      getIO().to(`user-${recipient._id}`).emit('newMessage', {
        chatId: chat._id,
        message: payload,
        senderName: req.user.name,
        title: `New message from ${req.user.name}`,
        content: payload.content.substring(0, 50) +
          (payload.content.length > 50 ? '...' : ''),
        link: `/chat/${recipient.role || 'user'}/${chat._id}`
      });
    }

    // Also emit to sender's own room (so the sender UI can react if needed)
    getIO().to(`user-${req.user._id}`).emit('messageSent', {
      chatId: chat._id,
      message: payload
    });

    // ─── NEW: broadcast into the chat room so connected clients get it live ───
    getIO()
      .to(chat._id.toString())
      .emit('messageBroadcast', {
        chatId: chat._id,
        message: payload
      });

    // Send immediate email notification for new message
    sendImmediateNotification(chat._id, req.user._id, content.trim());

    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
}

 /* @route   POST /api/chat/send-file
 * @access  Private
 */
export const sendFileMessage = async (req, res, next) => {
  try {
    const { chatId, content, replyTo, voiceDuration } = req.body;
    
    // 🔍 Debug: Log what we received from frontend
    console.log('🔍 Backend received file upload request:');
    console.log('  - chatId:', chatId);
    console.log('  - content (caption):', `"${content}"`);
    console.log('  - content length:', content ? content.length : 0);
    console.log('  - replyTo:', replyTo || 'none');
    console.log('  - voiceDuration:', voiceDuration || 'none');
    console.log('  - file info:', {
      originalname: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size
    });
    
    // Multer places the file into req.file
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' });
    }

    // 1) Find the chat
    const chat = await Chat.findById(chatId).populate('participants', 'name avatar role');
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    // 2) Check that the sender is actually a participant
    const senderId = req.user._id.toString();
    const isParticipant = chat.participants.some(p => p._id.toString() === senderId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    // 3) Upload the file buffer to S3 under folder "chat-files/"
    //    The upload.js utility will generate a random UUID-prefixed key for us.
    const s3Data = await uploadToS3(req.file, 'chat-files');
    const fileUrl = s3Data.Location; // public URL

    // 🔍 Debug: Determine final content for message
    const finalContent = content && content.trim() ? content.trim() : `File: ${req.file.originalname}`;
    console.log('🔍 Final message content decision:');
    console.log('  - Original content:', `"${content}"`);
    console.log('  - Content after trim:', `"${content && content.trim()}"`);
    console.log('  - Final content chosen:', `"${finalContent}"`);

    // 4) Create a new message subdoc
    const newMsgSubdoc = {
      sender: req.user._id,
      content: finalContent, // Use caption if provided, fallback to filename
      fileUrl: fileUrl,                          // S3 URL
      fileName: req.file.originalname,           // Original filename
      fileType: req.file.mimetype,              // MIME type
      voiceDuration: voiceDuration ? Number(voiceDuration) : undefined, // Voice duration in seconds
      timestamp: new Date(),
      read: false,
      replyTo: replyTo || null // Support replying to messages
    };

    console.log('🔍 Created message subdoc:', {
      content: newMsgSubdoc.content,
      fileName: newMsgSubdoc.fileName,
      fileType: newMsgSubdoc.fileType,
      hasFileUrl: !!newMsgSubdoc.fileUrl
    });

    chat.messages.push(newMsgSubdoc);
    chat.updatedAt = new Date();
    await chat.save();

    // 5) Populate the newly added message's sender field
    await chat.populate({
      path: 'messages.sender',
      select: 'name avatar',
    });

    const inserted = chat.messages[chat.messages.length - 1];
    
    // Build the payload (including manual replyTo if needed)
    const payload = {
      _id: inserted._id,
      sender: {
        _id: inserted.sender._id,
        name: inserted.sender.name,
        avatar: inserted.sender.avatar,
      },
      content: inserted.content,      // Caption or filename
      fileUrl: inserted.fileUrl,      // S3 URL
      fileName: inserted.fileName,    // Original filename
      fileType: inserted.fileType,    // MIME type
      voiceDuration: inserted.voiceDuration, // Voice duration in seconds
      timestamp: inserted.timestamp,
      read: inserted.read,
      replyTo: null
    };

    console.log('🔍 Final payload being sent to frontend:', {
      id: payload._id,
      content: `"${payload.content}"`,
      fileName: payload.fileName,
      fileType: payload.fileType,
      hasFileUrl: !!payload.fileUrl,
      senderName: payload.sender.name
    });

    // Handle replyTo data manually like in sendMessage
    if (inserted.replyTo) {
      const repliedMsg = chat.messages.id(inserted.replyTo);
      if (repliedMsg && repliedMsg.sender) {
        payload.replyTo = {
          _id: repliedMsg._id,
          content: repliedMsg.content,
          timestamp: repliedMsg.timestamp,
          sender: {
            _id: repliedMsg.sender._id,
            name: repliedMsg.sender.name,
            avatar: repliedMsg.sender.avatar
          }
        };
      }
    }

    // 6) Notify all OTHER participants via Notification + Socket.IO
    chat.participants.forEach((participant) => {
      if (participant._id.toString() !== senderId) {
        const title = `New file from ${req.user.name}`;
        const preview = content && content.trim() ? 
          content.trim().slice(0, 50) + (content.trim().length > 50 ? '...' : '') :
          req.file.originalname.slice(0, 30);
        const link = `/chat/${req.user.role}/${chat._id}`; 
        Notification.create({
          user: participant._id,
          type: 'message',
          title,
          message: preview,
          link,
          read: false,
        });
        // Emit "newMessage" event to the user's private room
        getIO().to(`user-${participant._id}`).emit('newMessage', {
          chatId: chat._id,
          message: payload,
          senderName: req.user.name,
          title,
          content: preview,
          link,
        });
      }
    });

    // 7) Also broadcast message to the chat room itself (for real-time UI)
    getIO().to(chat._id.toString()).emit('messageBroadcast', {
      chatId: chat._id,
      message: payload,
    });

    // 8) Acknowledge back to the sender
    getIO().to(`user-${senderId}`).emit('messageSent', {
      chatId: chat._id,
      message: payload,
    });

    return res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────────────────────────
// 5) Export all writer chats (Admin/Writer access)
// ────────────────────────────────────────────────────────────────────────────────
export const exportWriterChats = async (req, res, next) => {
  try {
    const { format = 'json', startDate, endDate, writerId, email } = req.query;
    
    // Build query filter
    const filter = {};
    
    // Filter by date range if provided
    if (startDate || endDate) {
      filter.updatedAt = {};
      if (startDate) {
        filter.updatedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.updatedAt.$lte = new Date(endDate);
      }
    }
    
    // Filter by writer if provided
    if (writerId) {
      filter.participants = writerId;
    } else if (req.user.role === 'writer') {
      // If user is a writer, only export their chats
      filter.participants = req.user._id;
    }
    
    // Find all chats with messages
    const chats = await Chat.find(filter)
      .populate('participants', 'name email role')
      .populate('messages.sender', 'name email role')
      .sort({ updatedAt: -1 });
    
    // Filter to only include chats with writers
    let writerChats = chats.filter(chat => 
      chat.participants.some(participant => participant.role === 'writer')
    );
    
    // Filter by email if provided
    if (email) {
      writerChats = writerChats.filter(chat => 
        chat.participants.some(participant => 
          participant.email && participant.email.toLowerCase().includes(email.toLowerCase())
        )
      );
    }
    
    if (writerChats.length === 0) {
      return res.status(404).json({ 
        message: 'No writer chats found for the specified criteria' 
      });
    }
    
    // Format the data for export
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        totalChats: writerChats.length,
        totalMessages: writerChats.reduce((sum, chat) => sum + chat.messages.length, 0),
        format: format,
        exportedBy: req.user.name,
        exportedByEmail: req.user.email
      },
      chats: writerChats.map(chat => ({
        chatId: chat._id,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        participants: chat.participants.map(p => ({
          id: p._id,
          name: p.name,
          email: p.email,
          role: p.role
        })),
        messages: chat.messages.map(msg => ({
          id: msg._id,
          sender: {
            id: msg.sender._id,
            name: msg.sender.name,
            email: msg.sender.email,
            role: msg.sender.role
          },
          content: msg.content,
          timestamp: msg.timestamp,
          read: msg.read,
          type: msg.type || 'text',
          fileUrl: msg.fileUrl || null,
          fileName: msg.fileName || null,
          fileType: msg.fileType || null,
          voiceDuration: msg.voiceDuration || null,
          callDuration: msg.callDuration || null,
          replyTo: msg.replyTo || null
        }))
      }))
    };
    
    // Set appropriate headers based on format
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="writer_chats_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvData);
    } else if (format === 'xlsx') {
      // Convert to Excel format
      const xlsxBuffer = await convertToXLSX(exportData);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="writer_chats_${new Date().toISOString().split('T')[0]}.xlsx"`);
      return res.send(xlsxBuffer);
    } else {
      // Default to JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="writer_chats_${new Date().toISOString().split('T')[0]}.json"`);
      return res.json(exportData);
    }
    
  } catch (err) {
    next(err);
  }
};

// Helper function to convert data to CSV format
const convertToCSV = (data) => {
  const headers = [
    'Chat ID',
    'Created At',
    'Updated At',
    'Participant 1 Name',
    'Participant 1 Email',
    'Participant 1 Role',
    'Participant 2 Name',
    'Participant 2 Email',
    'Participant 2 Role',
    'Message ID',
    'Sender Name',
    'Sender Email',
    'Sender Role',
    'Message Content',
    'Message Timestamp',
    'Message Read',
    'Message Type',
    'File Name',
    'File Type',
    'Voice Duration',
    'Call Duration',
    'Reply To Message ID'
  ];
  
  const rows = data.chats.flatMap(chat => 
    chat.messages.map(msg => [
      chat.chatId,
      chat.createdAt,
      chat.updatedAt,
      chat.participants[0]?.name || '',
      chat.participants[0]?.email || '',
      chat.participants[0]?.role || '',
      chat.participants[1]?.name || '',
      chat.participants[1]?.email || '',
      chat.participants[1]?.role || '',
      msg.id,
      msg.sender.name,
      msg.sender.email,
      msg.sender.role,
      `"${msg.content.replace(/"/g, '""')}"`, // Escape quotes in content
      msg.timestamp,
      msg.read,
      msg.type,
      msg.fileName || '',
      msg.fileType || '',
      msg.voiceDuration || '',
      msg.callDuration || '',
      msg.replyTo || ''
    ])
  );
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

// Helper function to convert data to XLSX format
const convertToXLSX = async (data) => {
  const XLSX = await import('xlsx');
  
  // Create worksheets
  const worksheets = {};
  
  // Summary sheet
  worksheets['Summary'] = XLSX.utils.json_to_sheet([{
    'Export Date': data.exportInfo.timestamp,
    'Total Chats': data.exportInfo.totalChats,
    'Total Messages': data.exportInfo.totalMessages,
    'Exported By': data.exportInfo.exportedBy,
    'Exported By Email': data.exportInfo.exportedByEmail
  }]);
  
  // Chats sheet
  const chatData = data.chats.map(chat => ({
    'Chat ID': chat.chatId,
    'Created At': chat.createdAt,
    'Updated At': chat.updatedAt,
    'Participant 1': chat.participants[0]?.name || '',
    'Participant 1 Email': chat.participants[0]?.email || '',
    'Participant 1 Role': chat.participants[0]?.role || '',
    'Participant 2': chat.participants[1]?.name || '',
    'Participant 2 Email': chat.participants[1]?.email || '',
    'Participant 2 Role': chat.participants[1]?.role || '',
    'Total Messages': chat.messages.length
  }));
  worksheets['Chats'] = XLSX.utils.json_to_sheet(chatData);
  
  // Messages sheet
  const messageData = data.chats.flatMap(chat => 
    chat.messages.map(msg => ({
      'Chat ID': chat.chatId,
      'Message ID': msg.id,
      'Sender Name': msg.sender.name,
      'Sender Email': msg.sender.email,
      'Sender Role': msg.sender.role,
      'Content': msg.content,
      'Timestamp': msg.timestamp,
      'Read': msg.read,
      'Type': msg.type,
      'File Name': msg.fileName || '',
      'File Type': msg.fileType || '',
      'Voice Duration': msg.voiceDuration || '',
      'Call Duration': msg.callDuration || '',
      'Reply To': msg.replyTo || ''
    }))
  );
  worksheets['Messages'] = XLSX.utils.json_to_sheet(messageData);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  Object.keys(worksheets).forEach(name => {
    XLSX.utils.book_append_sheet(workbook, worksheets[name], name);
  });
  
  // Generate buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

// ────────────────────────────────────────────────────────────────────────────────
// 6) Get export history and statistics
// ────────────────────────────────────────────────────────────────────────────────
export const getExportHistory = async (req, res, next) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const exportsDir = path.join(__dirname, '..', 'exports');
    
    // Check if exports directory exists
    if (!fs.existsSync(exportsDir)) {
      return res.json({ exports: [], stats: { totalExports: 0, totalSize: 0 } });
    }
    
    // Read all files in exports directory
    const files = fs.readdirSync(exportsDir);
    const exportFiles = files
      .filter(file => file.startsWith('writer_chats_'))
      .map(file => {
        const filePath = path.join(exportsDir, file);
        const stats = fs.statSync(filePath);
        const format = file.split('.').pop();
        
        return {
          filename: file,
          format: format,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Calculate total size
    const totalSize = exportFiles.reduce((sum, file) => sum + file.size, 0);
    
    res.json({
      exports: exportFiles,
      stats: {
        totalExports: exportFiles.length,
        totalSize: totalSize,
        totalSizeFormatted: formatBytes(totalSize)
      }
    });
    
  } catch (err) {
    next(err);
  }
};

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ────────────────────────────────────────────────────────────────────────────────
// 7) View exported file content
// ────────────────────────────────────────────────────────────────────────────────
export const viewExportedFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, '..', 'exports', filename);
    
    // Security check - only allow writer_chats files
    if (!filename.startsWith('writer_chats_') || !filename.endsWith('.json')) {
      return res.status(400).json({ message: 'Invalid file type' });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    res.json(data);
    
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ message: 'File not found' });
    }
    next(err);
  }
};
