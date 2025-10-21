import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { createNewChat, getAllChats, getMessagesByChat, sendMessage } from "../controllers/chat.js";
import { upload } from "../middlewares/multer.js";

const router = Router();

router.post("/new", authMiddleware, createNewChat);
router.get("/all", authMiddleware, getAllChats);
router.post("/message", authMiddleware, upload.single('image'), sendMessage);
router.get("/message/:chatId", authMiddleware, getMessagesByChat);

export default router;