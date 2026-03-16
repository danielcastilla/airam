import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { User, JWTPayload } from '../types';
import { ApiError } from '../middleware/errorHandler';

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );

    if (existingUser.rows[0]) {
      throw new ApiError('Email already registered', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, 'viewer') 
       RETURNING id, email, name, role, is_active, created_at, updated_at`,
      [data.email, password_hash, data.name]
    );

    const user = result.rows[0];
    const tokens = this.generateTokens(user);

    return {
      user,
      ...tokens
    };
  },

  async login(data: LoginDTO): Promise<AuthResponse> {
    // Find user
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [data.email]
    );

    const user = result.rows[0];
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    if (!user.is_active) {
      throw new ApiError('Account is disabled', 403);
    }

    // Check password
    const isMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!isMatch) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;
    const tokens = this.generateTokens(user);

    return {
      user: userWithoutPassword,
      ...tokens
    };
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const secret = process.env.JWT_SECRET || 'default-secret';
      const decoded = jwt.verify(refreshToken, secret) as JWTPayload & { type: string };

      if (decoded.type !== 'refresh') {
        throw new ApiError('Invalid refresh token', 401);
      }

      // Verify user still exists and is active
      const result = await query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      const user = result.rows[0];
      if (!user || !user.is_active) {
        throw new ApiError('User not found or disabled', 401);
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      throw new ApiError('Invalid refresh token', 401);
    }
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new ApiError('Current password is incorrect', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, userId]
    );
  },

  async getProfile(userId: number): Promise<Omit<User, 'password_hash'>> {
    const result = await query(
      'SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      throw new ApiError('User not found', 404);
    }

    return result.rows[0];
  },

  generateTokens(user: { id: number; email: string; role: string }): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user)
    };
  },

  generateAccessToken(user: { id: number; email: string; role: string }): string {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role, type: 'access' },
      secret,
      { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
    );
  },

  generateRefreshToken(user: { id: number; email: string; role: string }): string {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role, type: 'refresh' },
      secret,
      { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
    );
  }
};
