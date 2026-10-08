import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireGroupMember } from '../middlewares/groupMemberGuard.js';

const router = Router();
router.use(authenticate);

// Chỉ thành viên nhóm mới xem được bảng xếp hạng nhóm
router.get('/:groupId', requireGroupMember(), getLeaderboard);

export default router;
