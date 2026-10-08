import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead, respondToInvite, deleteNotification, deleteReadNotifications } from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getNotifications);
router.delete('/read', deleteReadNotifications);
router.delete('/:id', deleteNotification);
router.post('/:id/respond', respondToInvite);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

export default router;
