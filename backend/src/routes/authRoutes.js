import express from 'express';
import { register, login, googleLogin, getMe, getAuthConfig } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', getAuthConfig);
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', authenticateToken, getMe);

export default router;
