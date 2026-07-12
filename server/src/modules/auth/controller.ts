import { Request, Response, NextFunction } from 'express';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './validation';
import { registerUser, loginUser, requestPasswordReset, resetPassword, getUserById } from './service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validates inputs using the Zod schema (strips extra fields)
    const data = signupSchema.parse(req.body);

    const user = await registerUser(data.name, data.email, data.password);

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validates login credentials format
    const data = loginSchema.parse(req.body);

    const result = await loginUser(data.email, data.password);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    const token = await requestPasswordReset(data.email);
    
    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been generated.',
      _demoToken: token
    });
  } catch (err) {
    next(err);
  }
};

export const resetPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    await resetPassword(data.token, data.password);
    
    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset.'
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    }
    const user = await getUserById(req.user.userId);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};
