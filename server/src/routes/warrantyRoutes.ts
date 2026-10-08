import { Router } from 'express';
import { getWarranties, extendWarranty, addWarrantyClaim } from '../controllers/warrantyController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireGroupMember } from '../middlewares/groupMemberGuard.js';

import Sale from '../models/Sale.js';
import { requireResourceAccess } from '../middlewares/resourceGuard.js';
const router = Router();
router.use(authenticate);

const optionalGroupGuard = async (req, res, next) => {
  const groupId = req.query.groupId || req.body.groupId;
  if (groupId) {
    return requireGroupMember()(req, res, next);
  }
  next();
};

router.get('/', optionalGroupGuard, getWarranties);
router.post('/:id/extend', requireResourceAccess(Sale, true), extendWarranty);
router.post('/:id/claim', requireResourceAccess(Sale, true), addWarrantyClaim);

export default router;
