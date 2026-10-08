import { Router } from 'express';
import { getBudgets, setBudget, deleteBudget } from '../controllers/budgetController.js';
import { authenticate } from '../middlewares/auth.js';

import { requireGroupMember } from '../middlewares/groupMemberGuard.js';
const optionalGroupGuard = (req, res, next) => req.query.groupId || req.body.groupId ? requireGroupMember()(req, res, next) : next();
const router = Router();
router.use(authenticate);
router.use(optionalGroupGuard);

router.get('/', getBudgets);
router.post('/', setBudget);
router.delete('/:id', deleteBudget);

export default router;
