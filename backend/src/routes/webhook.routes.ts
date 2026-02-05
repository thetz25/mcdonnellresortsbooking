import { Router } from 'express';
import { handleJotFormWebhook } from '../controllers/webhook.controller';

const router = Router();

// JotForm webhook endpoint (public - no authentication required)
router.post('/jotform', handleJotFormWebhook);

export default router;