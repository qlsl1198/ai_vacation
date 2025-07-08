import express from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import User, { IUser } from '../models/User';
import { Document } from 'mongoose';

const router = express.Router();

// Generate JWT Token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('User already exists', 400));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    }) as any;

    if (user && user._id) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences,
          token: generateToken((user._id as any).toString())
        }
      });
    } else {
      return next(new AppError('Invalid user data', 400));
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password') as any;
    if (!user || !user._id) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        token: generateToken((user._id as any).toString())
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', async (req, res, next) => {
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

export default router; 