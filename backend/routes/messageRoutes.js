import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getMessages,
  getMessageById,
  sendMessageRequest,
  cancelMessageRequest,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/", protect, getMessages);
router.get("/:id", protect, getMessageById);
router.post("/", protect, sendMessageRequest);
router.delete("/:id", protect, cancelMessageRequest);

export default router;
