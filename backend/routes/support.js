import express from 'express';
import { protect } from '../middlewares/auth.js';
import { createSupportTicket, getSupportTickets, respondToTicket } from '../controllers/supportController.js';

const router = express.Router();

router.use(protect);
router.post('/', createSupportTicket);
router.get('/', getSupportTickets);
router.post('/respond', respondToTicket);

export default router;