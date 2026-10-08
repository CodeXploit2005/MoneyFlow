import Budget from '../models/Budget.js';
import { requireResourceAccess } from '../middlewares/resourceGuard.js';
import { Router } from 'express';
import { getBudgets, setBudget, deleteBudget } from '../controllers/budgetController.js';
import { authenticate } from '../middlewares/auth.js';

import { requireGroupMember } from '../middlewares/groupMemberGuard.js';
const optionalGroupGuard = (req, res, next) => req.query.groupId || req.body.groupId ? requireGroupMember()(req, res, next) : next();
const router = Router();
router.use(authenticate);
router.use(optionalGroupGuard);

router.get('/', getBudgets);
router.post('/', (req, res, next) => req.body.groupId ? requireGroupMember(['owner', 'admin'])(req, res, next) : next(), setBudget);
router.delete('/:id', requireResourceAccess(Budget, true, true), deleteBudget);

export default router;
