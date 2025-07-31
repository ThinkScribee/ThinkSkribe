// server/controllers/chatController.js
import { uploadToS3 } from '../utils/upload.js'; // 🔧 S3 helper
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';
import Notification from '../models/Notification.js';
import { getUserLocationData } from '../middlewares/locationMiddleware.js';

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

    // Enhance each chat with formatted location data
    const enhancedChats = chats.map(chat => {
      const chatObj = chat.toObject();
      
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