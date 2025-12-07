import Order from '../models/Order.js';
import File from '../models/File.js';
import { uploadToS3 } from '../utils/upload.js';
import { getIO } from '../socket.js';
import { ORDER_STATUS } from '../models/constants.js';

export const createOrder = async (req, res, next) => {
  try {
    const { title, description, totalAmount, installments, writerId } = req.body;
    const order = await Order.create({
      student: req.user._id,
      writer: writerId,
      title,
      description,
      totalAmount,
      installments,
      status: ORDER_STATUS.PENDING,
    });

    getIO().to(`user-${writerId}`).emit('newOrder', {
      orderId: order._id,
      title,
      studentId: req.user._id,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('student', 'name email avatar')
      .populate('writer', 'name avatar');
    if (!order || (order.student.toString() !== req.user._id.toString() && order.writer.toString() !== req.user._id.toString())) {
      res.status(404);
      throw new Error('Order not found or unauthorized');
    }
    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {
      $or: [{ student: req.user._id }, { writer: req.user._id }],
    };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('student', 'name avatar')
      .populate('writer', 'name avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({ success: true, orders, total });
  } catch (err) {
    next(err);
  }
};

export const updateOrder = async (req, res, next) => {
  try {
    const { status, progress } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order || (order.student.toString() !== req.user._id.toString() && order.writer.toString() !== req.user._id.toString())) {
      res.status(404);
      throw new Error('Order not found or unauthorized');
    }

    if (status) order.status = status;
    if (progress) order.progress = progress;
    await order.save();

    getIO().to(`user-${order.student}`).emit('orderUpdated', {
      orderId: order._id,
      status: order.status,
      progress: order.progress,
    });
    if (order.writer) {
      getIO().to(`user-${order.writer}`).emit('orderUpdated', {
        orderId: order._id,
        status: order.status,
        progress: order.progress,
      });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.student.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Order not found or unauthorized');
    }

    order.status = ORDER_STATUS.CANCELLED;
    await order.save();

    if (order.writer) {
      getIO().to(`user-${order.writer}`).emit('orderCancelled', {
        orderId: order._id,
        title: order.title,
      });
    }

    res.status(200).json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    next(err);
  }
};

export const uploadOrderFile = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    const order = await Order.findById(req.params.id);
    if (!order || (order.student.toString() !== req.user._id.toString() && order.writer.toString() !== req.user._id.toString())) {
      res.status(404);
      throw new Error('Order not found or unauthorized');
    }

    const s3Data = await uploadToS3(req.file, 'orders');
    const file = await File.create({
      user: req.user._id,
      filename: s3Data.Key,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      key: s3Data.Key,
      url: s3Data.Location,
    });

    order.files.push(file._id);
    await order.save();

    getIO().to(`user-${order.student}`).emit('orderFileUploaded', {
      orderId: order._id,
      fileId: file._id,
      filename: file.originalname,
    });
    if (order.writer) {
      getIO().to(`user-${order.writer}`).emit('orderFileUploaded', {
        orderId: order._id,
        fileId: file._id,
        filename: file.originalname,
      });
    }

    res.status(201).json({ success: true, file });
  } catch (err) {
    next(err);
  }
};