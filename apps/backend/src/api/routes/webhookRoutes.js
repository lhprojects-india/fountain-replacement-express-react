import express from 'express';
import { handleFountainWebhook } from '../controllers/webhookController.js';

const router = express.Router();

router.post('/fountain', handleFountainWebhook);

export default router;
