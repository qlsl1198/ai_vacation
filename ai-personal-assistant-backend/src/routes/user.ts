import express from 'express';
import { AppError } from '../utils/AppError';
import User from '../models/User';

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById((req as any).user.id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
router.put('/profile', async (req, res, next) => {
  try {
    const { name, preferences } = req.body;
    const user = await User.findByIdAndUpdate(
      (req as any).user.id,
      { name, preferences },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

export default router; 