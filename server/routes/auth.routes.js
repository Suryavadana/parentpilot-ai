import express from 'express';
import {
  signup, login, me, createInvite, joinFamily,
} from '../controllers/auth.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import attachFamily from '../middleware/attachFamily.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/invite', requireAuth, attachFamily, createInvite);
router.post('/join', joinFamily);

export default router;
