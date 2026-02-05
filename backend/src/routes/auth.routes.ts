import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty()
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], login);

// Protected routes
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, authorize('admin', 'manager'), getAllUsers);
router.put('/users/:id', authenticate, authorize('admin'), updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);

export default router;