import express from 'express';
import { loginUser, userRegistration, verifyUser } from '../controller/auth.controller';

const router = express.Router();

router.post('/user-registration', userRegistration);
router.post('/verify-user', verifyUser);
router.post('/login', loginUser);

export default router;