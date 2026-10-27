import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.validators.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, validate({ body: loginSchema }), authCtrl.login);
router.post('/refresh', authCtrl.refresh);
router.post('/logout', auth, authCtrl.logout);
router.get('/me', auth, authCtrl.me);
router.patch('/change-password', auth, validate({ body: changePasswordSchema }), authCtrl.changePassword);
router.post('/change-password', auth, validate({ body: changePasswordSchema }), authCtrl.changePassword);

export default router;
