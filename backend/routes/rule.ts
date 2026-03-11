import { Router } from 'express';

import {
  handleCreateRule, handleDeleteRule, handleGetDeviceRules,
} from '@/controllers/rule.js';
import { requireAuth } from '@/middleware/auth.js';

const router = Router();

router.post("/", requireAuth, handleCreateRule);

router.get("/", requireAuth, handleGetDeviceRules);

router.delete("/", requireAuth, handleDeleteRule);

export default router;
