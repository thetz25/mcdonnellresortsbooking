import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  confirmBooking,
  checkInBooking,
  checkOutBooking,
  deleteBooking
} from '../controllers/booking.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAllBookings);
router.get('/:id', getBookingById);

router.post('/', [
  body('accommodationId').isUUID(),
  body('guestName').trim().notEmpty(),
  body('guestEmail').isEmail().normalizeEmail(),
  body('guestPhone').trim().notEmpty(),
  body('numberOfGuests').isInt({ min: 1 }),
  body('checkInDate').isISO8601(),
  body('checkOutDate').isISO8601(),
  body('totalAmount').isDecimal()
], createBooking);

router.put('/:id', updateBooking);

router.post('/:id/cancel', cancelBooking);
router.post('/:id/confirm', confirmBooking);
router.post('/:id/checkin', checkInBooking);
router.post('/:id/checkout', checkOutBooking);

router.delete('/:id', authorize('admin', 'manager'), deleteBooking);

export default router;