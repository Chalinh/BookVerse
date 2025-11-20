import express from 'express';
import { signup, login } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator } from '../middleware/validators/auth.validator.js';
import { validate } from '../middleware/validators/validator.js';

const router = express.Router();

router.post('/register', registerValidator, validate, signup);
router.post('/login', loginValidator, validate, login);

export default router;
