import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { updateUserValidator, updatePasswordValidator } from '../middleware/validators/user.validator.js';
import { validate } from '../middleware/validators/validator.js';

import {
  getProfile,
  updateProfile,
  updatePassword,
} from '../controllers/user.controller.js';

const router = express.Router();

// View personal info
router.get('/profile', authMiddleware, getProfile);

// Update username/email
router.patch(
  '/profile',
  authMiddleware,
  updateUserValidator,
  validate,
  updateProfile
);

// Update password
router.patch(
  '/password',
  authMiddleware,
  updatePasswordValidator,
  validate,
  updatePassword
);

export default router;
