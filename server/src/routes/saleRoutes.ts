import Sale from '../models/Sale.js';
import { requireResourceAccess } from '../middlewares/resourceGuard.js';
import { Router } from 'express';
import { getSales, getSaleById, createSale, recordPayment } from '../controllers/saleController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireGroupMember } from '../middlewares/groupMemberGuard.js';

const router = Router();
router.use(authenticate);

const optionalGroupGuard = async (req, res, next) => {
  const groupId = req.query.groupId || req.body.groupId;
  if (groupId) {
    return requireGroupMember()(req, res, next);
  }
  next();
};

router.get('/', optionalGroupGuard, getSales);
router.get('/:id', requireResourceAccess(Sale), getSaleById);
router.post('/', optionalGroupGuard, createSale);
router.post('/:id/payments', requireResourceAccess(Sale, true), recordPayment);

export default router;
