import express from 'express';
import { AppError } from '../utils/AppError';

const router = express.Router();

// @desc    Send message to AI
// @route   POST /api/chat/message
// @access  Private
router.post('/message', async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      return next(new AppError('Message is required', 400));
    }

    // TODO: Integrate with OpenAI API
    // For now, return a mock response
    const aiResponse = {
      message: `AI received: "${message}". This is a mock response.`,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: aiResponse
    });
  } catch (error) {
    next(error);
  }
});

export default router; 