import Debt from '../models/Debt.js';
import { requireResourceAccess } from '../middlewares/resourceGuard.js';
import { Router } from 'express';
import { getDebts, createDebt, recordDebtPayment, deleteDebt, updateDebt, updateDebtPayment } from '../controllers/debtController.js';
import { authenticate } from '../middlewares/auth.js';

import { requireGroupMember } from '../middlewares/groupMemberGuard.js';
const optionalGroupGuard = (req, res, next) => req.query.groupId || req.body.groupId ? requireGroupMember()(req, res, next) : next();
const router = Router();
router.use(authenticate);
router.use(optionalGroupGuard);

router.get('/', getDebts);
router.post('/', createDebt);
router.patch('/:id', requireResourceAccess(Debt, true), updateDebt);
router.patch('/:id/payments/:paymentId', requireResourceAccess(Debt, true), updateDebtPayment);
router.post('/:id/pay', requireResourceAccess(Debt, true), recordDebtPayment);
router.delete('/:id', requireResourceAccess(Debt, true), deleteDebt);

export default router;
