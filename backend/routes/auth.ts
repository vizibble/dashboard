import { Router } from 'express';

import {
  handleLogin,
  handleLogout,
  handleRefresh,
} from '@/controllers/auth.js';

const router = Router();

router.post('/login', handleLogin);

router.post('/refresh', handleRefresh);

router.post('/logout', handleLogout);

export default router;
