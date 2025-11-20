import { body } from 'express-validator';

export const updateUserValidator = [
  body('username')
    .optional()
    .isLength({ min: 5 })
    .withMessage('Username must be at least 5 characters'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
];

export const updatePasswordValidator = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Old password is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];
