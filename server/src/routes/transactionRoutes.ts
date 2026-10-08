import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  softDeleteTransaction,
  restoreTransaction
} from '../controllers/transactionController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireGroupMember } from '../middlewares/groupMemberGuard.js';

import Transaction from '../models/Transaction.js';
import { requireResourceAccess } from '../middlewares/resourceGuard.js';
const router = Router();
router.use(authenticate);

// Middleware kiểm tra nếu có groupId trong query hoặc body
const optionalGroupGuard = async (req, res, next) => {
  const groupId = req.query.groupId || req.body.groupId;
  if (groupId) {
    return requireGroupMember()(req, res, next);
  }
  next();
};

router.get('/', optionalGroupGuard, getTransactions);
router.get('/:id', requireResourceAccess(Transaction), getTransactionById);
router.post('/', optionalGroupGuard, createTransaction);
router.put('/:id', optionalGroupGuard, requireResourceAccess(Transaction, true), updateTransaction);
router.delete('/:id', optionalGroupGuard, requireResourceAccess(Transaction, true), softDeleteTransaction);
router.post('/:id/restore', optionalGroupGuard, requireResourceAccess(Transaction, true), restoreTransaction);

export default router;
