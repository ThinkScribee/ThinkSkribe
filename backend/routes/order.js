import express from 'express';
import { protect } from '../middlewares/auth.js';
import { role } from '../middlewares/role.js';
import { 
  createOrder, 
  getOrder, 
  getUserOrders, 
  updateOrder, 
  cancelOrder, 
  uploadOrderFile 
} from '../controllers/orderController.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

router.use(protect);
router.post('/', role('student'), createOrder);
router.get('/:id', getOrder);
router.get('/user', getUserOrders);
router.patch('/:id', updateOrder);
router.delete('/:id', role('student'), cancelOrder);
router.post('/:id/upload', upload.single('file'), uploadOrderFile);

export default router;