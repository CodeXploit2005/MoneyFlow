import { Router } from 'express';
import {
  getOverview,
  getDailyChart,
  getCategoryBreakdown,
  getTopProducts,
  getSmartInsights,
  exportTransactionsCsv
} from '../controllers/reportController.js';
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

router.get('/overview', optionalGroupGuard, getOverview);
router.get('/daily-chart', optionalGroupGuard, getDailyChart);
router.get('/category-breakdown', optionalGroupGuard, getCategoryBreakdown);
router.get('/top-products', optionalGroupGuard, getTopProducts);
router.get('/insights', optionalGroupGuard, getSmartInsights);
router.get('/export-csv', optionalGroupGuard, exportTransactionsCsv);

export default router;
