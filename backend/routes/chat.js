// server/routes/chat.js
import express from 'express';
import { protect } from '../middlewares/auth.js';
import { updateUserLocation } from '../middlewares/locationMiddleware.js';
import { upload } from '../utils/upload.js'; // 🔧 Multer uploader
import {
  startChat,
  getChats,
  getChatMessages,
  sendMessage,
  sendFileMessage,    // 🔧 new controller function
} from '../controllers/chatController.js';

const router = express.Router();

// All chat routes require authentication and location update
router.use(protect);
router.use(updateUserLocation);

// 1) Start or get existing chat
router.post('/', startChat);

// 2) Get all chats for current user
router.get('/', getChats);

// 3) Get all messages in a specific chat
router.get('/:id/messages', getChatMessages);

// 4) Mark messages in a chat as “read”

// 5) Send a TEXT message in a chat (unchanged)
router.post('/send', sendMessage);

// 6) 🔧 Send a FILE or IMAGE in a chat
//    Use Multer to read the single “file” from the client.
//    We will write sendFileMessage() below in chatController.
router.post('/send-file', upload.single('file'), sendFileMessage);

export default router;
