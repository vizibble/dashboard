import { Router } from 'express';

import {
  handleLogin,
  handleLogout,
  handleRefresh,
} from '@/controllers/auth.js';

const router = Router();

router.post('/login', (req, res, next) => {
  handleLogin(req, res, next).catch(next);
});

router.post('/refresh', (req, res, next) => {
  handleRefresh(req, res, next);
});

router.post('/logout', (req, res, next) => {
  handleLogout(req, res, next);
});

export default router;
