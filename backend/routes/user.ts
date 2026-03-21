import { Router } from 'express';

import { handleGetSettings, handleUpdateSettings } from '@/controllers/user.js';
import { requireAuth } from '@/middleware/auth.js';

const router = Router();

router.get('/settings', requireAuth, (req, res, next) => {
  handleGetSettings(req, res, next).catch(next);
});

router.put('/settings', requireAuth, (req, res, next) => {
  handleUpdateSettings(req, res, next).catch(next);
});

export default router;
