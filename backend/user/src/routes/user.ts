import { Router } from "express";
import { getAllUsers, getAUsers, loginController, profileController, updateName, verifyUser } from "../controllers/user.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();


router.post('/login', loginController);
router.post('/verify', verifyUser);
router.get('/me', authMiddleware, profileController);
router.get('/all', authMiddleware, getAllUsers);
router.get('/:id', getAUsers);
router.post('/update', authMiddleware, updateName);

export default router;



