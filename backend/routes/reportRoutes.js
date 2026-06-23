import express from "express";

const router = express.Router();

// Minimal report routes (stub)
router.get("/", (req, res) => {
  res.json({ reports: [] });
});

export default router;
