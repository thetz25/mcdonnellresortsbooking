import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllAccommodations,
  getAccommodationById,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation
} from '../controllers/accommodation.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAllAccommodations);
router.get('/:id', getAccommodationById);

router.post('/', authorize('admin', 'manager'), [
  body('name').trim().notEmpty(),
  body('type').isIn(['villa', 'suite', 'room', 'bungalow']),
  body('maxGuests').isInt({ min: 1 }),
  body('basePrice').isDecimal()
], createAccommodation);

router.put('/:id', authorize('admin', 'manager'), updateAccommodation);
router.delete('/:id', authorize('admin'), deleteAccommodation);

export default router;