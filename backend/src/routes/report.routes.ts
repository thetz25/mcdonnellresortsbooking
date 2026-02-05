import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueReport,
  getOccupancyReport,
  getBookingTrends
} from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/revenue', authorize('admin', 'manager'), getRevenueReport);
router.get('/occupancy', authorize('admin', 'manager'), getOccupancyReport);
router.get('/trends', authorize('admin', 'manager'), getBookingTrends);

export default router;