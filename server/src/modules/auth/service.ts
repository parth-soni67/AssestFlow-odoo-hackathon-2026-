import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from '../../lib/env';
import crypto from 'crypto';

export const registerUser = async (name: string, email: string, passwordPlain: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Email is already registered.');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(passwordPlain, saltRounds);

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: Role.Employee, // Non-negotiable server-side default
      status: UserStatus.Active // Active on registration so they can log in immediately for the demo
    }
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  };
};

export const loginUser = async (email: string, passwordPlain: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  if (user.status === UserStatus.Inactive) {
    throw new AppError(403, 'ACCOUNT_INACTIVE', 'Account is inactive. Please contact support.');
  }

  const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, departmentId: user.departmentId },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      status: user.status,
    },
    accessToken,
    refreshToken,
  };
};

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return null;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: tokenExpiry,
    },
  });

  return token;
};

export const resetPassword = async (token: string, passwordPlain: string) => {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new AppError(400, 'INVALID_RESET_TOKEN', 'Reset token is invalid or has expired.');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(passwordPlain, saltRounds);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
};

export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User does not exist.');
  }

  if (user.status === UserStatus.Inactive) {
    throw new AppError(403, 'ACCOUNT_INACTIVE', 'Account is inactive.');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    status: user.status,
  };
};
