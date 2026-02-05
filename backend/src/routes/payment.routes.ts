import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  getPaymentsByBooking,
  deletePayment
} from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAllPayments);
router.get('/booking/:bookingId', getPaymentsByBooking);
router.get('/:id', getPaymentById);

router.post('/', [
  body('bookingId').isUUID(),
  body('amount').isDecimal(),
  body('paymentMethod').isIn(['credit_card', 'bank_transfer', 'cash', 'paypal', 'other']),
  body('paymentType').isIn(['deposit', 'full_payment', 'partial_payment', 'refund']),
  body('paymentDate').optional().isISO8601()
], createPayment);

router.put('/:id', updatePayment);
router.delete('/:id', authorize('admin', 'manager'), deletePayment);

export default router;