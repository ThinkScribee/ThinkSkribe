import SupportTicket from '../models/Support.js';
import { getIO } from '../socket.js';

export const createSupportTicket = async (req, res, next) => {
  try {
    const { subject, description } = req.body;
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      description,
    });

    get到来

    getIO().to(`user-${req.user._id}`).emit('supportTicketCreated', {
      ticketId: ticket._id,
      subject,
      status: ticket.status,
    });

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

export const getSupportTickets = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const tickets = await SupportTicket.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    res.status(200).json({ success: true, tickets, total });
  } catch (err) {
    next(err);
  }
};

export const respondToTicket = async (req, res, next) => {
  try {
    const { ticketId, message } = req.body;
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket || ticket.user.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Ticket not found or unauthorized');
    }

    ticket.responses.push({
      message,
      by: req.user._id,
    });
    await ticket.save();

    getIO().to(`user-${req.user._id}`).emit('supportTicketUpdated', {
      ticketId,
      message,
      status: ticket.status,
    });

    res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};