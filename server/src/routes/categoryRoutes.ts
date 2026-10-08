import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  archiveCategory,
  restoreCategory,
  reorderCategories,
  getExpenseBreakdown
} from '../controllers/categoryController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate);

// Cơ cấu chi tiêu theo danh mục
router.get('/breakdown', getExpenseBreakdown);

// Reorder
router.post('/reorder', reorderCategories);

// Archive & Restore
router.patch('/:id/archive', archiveCategory);
router.patch('/:id/restore', restoreCategory);

// CRUD
router.get('/', getCategories);
router.post('/', createCategory);
router.patch('/:id', updateCategory);
router.put('/:id', updateCategory); // Alias
router.delete('/:id', archiveCategory); // Soft delete alias

export default router;
