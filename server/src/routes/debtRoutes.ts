import { Router } from 'express';
import { getDebts, createDebt, recordDebtPayment, deleteDebt } from '../controllers/debtController.js';
import { authenticate } from '../middlewares/auth.js';

import { requireGroupMember } from '../middlewares/groupMemberGuard.js';
const optionalGroupGuard = (req, res, next) => req.query.groupId || req.body.groupId ? requireGroupMember()(req, res, next) : next();
const router = Router();
router.use(authenticate);
router.use(optionalGroupGuard);

router.get('/', getDebts);
router.post('/', createDebt);
router.post('/:id/pay', recordDebtPayment);
router.delete('/:id', deleteDebt);

export default router;
