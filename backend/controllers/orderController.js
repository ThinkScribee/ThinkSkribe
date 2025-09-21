import Order from '../models/Order.js';
import File from '../models/File.js';
import { uploadToS3 } from '../utils/upload.js';
import { getIO } from '../socket.js';
import { ORDER_STATUS } from '../models/constants.js';
import { generateOrderId } from '../utils/helpers.js';

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private (Student)
 */
export const createOrder = async (req, res, next) => {
  try {
    const { title, description, writerId, totalAmount, installments } = req.body;

    const order = await Order.create({
      student: req.user._id,
      writer: writerId,
      title,
      description,
      orderId: generateOrderId(),
      totalAmount,
      installments: installments.map(i => ({
        amount: i.amount,
        dueDate: new Date(i.dueDate)
      })),
      status: ORDER_STATUS.PENDING
    });

    // Notify writer of new order
    getIO().to(`user-${writerId}`).emit('newOrder', order);

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      $or: [
        { student: req.user._id },
        { writer: req.user._id }
      ]
    })
    .populate('student', 'name email avatar')
    .populate('writer', 'name email avatar writerProfile')
    .populate('files');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all orders for a user
 * @route   GET /api/orders/user
 * @access  Private
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const query = req.user.role === 'student' 
      ? { student: req.user._id }
      : { writer: req.user._id };

    const orders = await Order.find(query)
      .populate('student', 'name email avatar')
      .populate('writer', 'name email avatar writerProfile')
      .sort('-createdAt');

    res.json(orders);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update order status
 * @route   PATCH /api/orders/:id
 * @access  Private
 */
export const updateOrder = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { 
        _id: req.params.id,
        $or: [
          { student: req.user._id },
          { writer: req.user._id }
        ]
      },
      { status },
      { new: true }
    )
    .populate('student', 'name email')
    .populate('writer', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Notify both parties of status change
    const notification = {
      orderId: order._id,
      status,
      title: order.title
    };

    getIO().to(`user-${order.student._id}`).emit('orderStatusChanged', notification);
    getIO().to(`user-${order.writer._id}`).emit('orderStatusChanged', notification);

    res.json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel order
 * @route   DELETE /api/orders/:id
 * @access  Private (Student)
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate(
      { 
        _id: req.params.id,
        student: req.user._id,
        status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.IN_PROGRESS] }
      },
      { status: ORDER_STATUS.CANCELLED },
      { new: true }
    ).populate('writer', 'name email');

    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found or cannot be cancelled' 
      });
    }

    // Notify writer of cancellation
    getIO().to(`user-${order.writer._id}`).emit('orderCancelled', {
      orderId: order._id,
      title: order.title
    });

    res.json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload file to order
 * @route   POST /api/orders/:id/upload
 * @access  Private
 */
export const uploadOrderFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      $or: [
        { student: req.user._id },
        { writer: req.user._id }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Upload file to S3
    const s3Data = await uploadToS3(req.file, 'orders');

    // Add file to order's files array
    order.files.push({
      url: s3Data.Location,
      name: req.file.originalname,
      uploadedBy: req.user._id
    });

    await order.save();

    // Notify other party of file upload
    const notifyUserId = req.user._id.equals(order.student) 
      ? order.writer 
      : order.student;

    getIO().to(`user-${notifyUserId}`).emit('orderFileUploaded', {
      orderId: order._id,
      fileName: req.file.originalname
    });

    res.json(order);
  } catch (err) {
    next(err);
  }
};