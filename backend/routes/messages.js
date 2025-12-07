import express from 'express';
import { getUnreadMessages, createMessage } from '../controllers/messageController.js';
import {protect} from '../middlewares/auth.js';

const router = express.Router();

router.get('/unread', protect, getUnreadMessages);
router.post('/', protect, createMessage);

export default router;