import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireGroupMember } from '../middlewares/groupMemberGuard.js';

import Customer from '../models/Customer.js';
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

router.get('/', optionalGroupGuard, getCustomers);
router.get('/:id', requireResourceAccess(Customer), getCustomerById);
router.post('/', optionalGroupGuard, createCustomer);
router.put('/:id', requireResourceAccess(Customer, true), updateCustomer);
router.delete('/:id', requireResourceAccess(Customer, true), deleteCustomer);

export default router;
