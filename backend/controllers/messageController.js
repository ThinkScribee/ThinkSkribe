import Message from '../models/Message.js';
import { Server } from 'socket.io';

let io;

export const createMessage = async (req, res) => {
  try {
    const { recipient, content, chatId } = req.body;
    const message = new Message({
      sender: req.user._id,
      recipient,
      content,
      chatId,
    });
    await message.save();
    io.to(`user-${recipient}`).emit('newMessage', {
      title: `New Message from ${req.user.name}`,
      content,
      link: `/messages/${chatId}`,
    });
    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnreadMessages = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};