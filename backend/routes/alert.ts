import { Router } from 'express';

import {
  handleCreateRule,
  handleDeleteRule,
  handleGetDeviceRules,
  handleGetUserAlerts,
} from '@/controllers/alert.js';
import { requireAuth } from '@/middleware/auth.js';

const router = Router();

router.get('/', requireAuth, (req, res, next) => {
  handleGetUserAlerts(req, res, next).catch(next);
});

router.post('/rules', requireAuth, (req, res, next) => {
  handleCreateRule(req, res, next).catch(next);
});

router.get('/rules', requireAuth, (req, res, next) => {
  handleGetDeviceRules(req, res, next).catch(next);
});

router.delete('/rules/:ruleId', requireAuth, (req, res, next) => {
  handleDeleteRule(req, res, next).catch(next);
});

export default router;
