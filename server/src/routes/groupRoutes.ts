import { Router } from 'express';
import {
  createGroup,
  deleteGroup,
  getMyGroups,
  getGroupDetail,
  updateGroupSettings,
  createInviteCode,
  joinGroupByCode,
  inviteByEmail,
  getGroupMembers,
  updateMemberRole,
  removeMember,
  leaveGroup,
  getActivityFeed
} from '../controllers/groupController.js';
import { authenticate } from '../middlewares/auth.js';
import {
  requireGroupMember,
  requireGroupAdminOrOwner,
  requireGroupOwner
} from '../middlewares/groupMemberGuard.js';

const router = Router();
router.use(authenticate);

// Cá nhân
router.get('/', getMyGroups);
router.post('/', createGroup);
router.post('/join', joinGroupByCode);

// Nhóm chi tiết - bắt buộc là thành viên
router.get('/:groupId', requireGroupMember(), getGroupDetail);
router.delete('/:groupId', requireGroupOwner, deleteGroup);
router.put('/:groupId/settings', requireGroupAdminOrOwner, updateGroupSettings);
router.get('/:groupId/activity', requireGroupMember(), getActivityFeed);

// Mời thành viên
router.post('/:groupId/invites', requireGroupMember(), createInviteCode);
router.post('/:groupId/invite-email', requireGroupAdminOrOwner, inviteByEmail);

// Quản lý thành viên
router.get('/:groupId/members', requireGroupMember(), getGroupMembers);
router.put('/:groupId/members/:memberId/role', requireGroupAdminOrOwner, updateMemberRole);
router.delete('/:groupId/members/:memberId', requireGroupAdminOrOwner, removeMember);
router.post('/:groupId/leave', leaveGroup);

export default router;
