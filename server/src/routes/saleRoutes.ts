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
router.get('/:id', getSaleById);
router.post('/', optionalGroupGuard, createSale);
router.post('/:id/payments', recordPayment);

export default router;
