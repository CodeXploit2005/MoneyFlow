import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import customerRoutes from './customerRoutes.js';
import saleRoutes from './saleRoutes.js';
import warrantyRoutes from './warrantyRoutes.js';
import groupRoutes from './groupRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';
import reportRoutes from './reportRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import budgetRoutes from './budgetRoutes.js';
import debtRoutes from './debtRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', saleRoutes);
router.use('/warranties', warrantyRoutes);
router.use('/groups', groupRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/budgets', budgetRoutes);
router.use('/debts', debtRoutes);

export default router;
