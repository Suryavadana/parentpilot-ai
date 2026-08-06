import express from 'express';
import {
  signup, login, me, createInvite, joinFamily, deleteAccount, listFamilyMembers, removeFamilyMember,
} from '../controllers/auth.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import attachFamily from '../middleware/attachFamily.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/invite', requireAuth, attachFamily, createInvite);
router.post('/join', joinFamily);
router.delete('/me', requireAuth, deleteAccount);
router.get('/members', requireAuth, attachFamily, requireRole('owner'), listFamilyMembers);
router.delete('/members/:userId', requireAuth, attachFamily, requireRole('owner'), removeFamilyMember);

export default router;
