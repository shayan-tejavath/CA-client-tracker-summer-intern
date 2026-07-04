const express = require("express");

const router = express.Router();

const {
  sendEmail,
} = require("../services/umsService");

router.get("/", async (req, res) => {
  try {
    const result = await sendEmail({
      to: "your-email@gmail.com",
      subject: "QwikCA Test",
      body: "UMS integration successful",
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;