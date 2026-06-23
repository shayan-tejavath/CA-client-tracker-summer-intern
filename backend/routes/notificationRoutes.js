import express from "express";

const router = express.Router();

// Minimal notification routes (stub)
router.get("/", (req, res) => {
  res.json({ notifications: [] });
});

export default router;
