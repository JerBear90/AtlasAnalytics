import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../types';

// Mock repositories before importing AuthService
jest.mock('../../repositories/userRepository');
jest.mock('../../repositories/sessionRepository');
jest.mock('../../repositories/passwordResetRepository');

import { UserRepository } from '../../repositories/userRepository';
import { SessionRepository } from '../../repositories/sessionRepository';
import { PasswordResetRepository } from '../../repositories/passwordResetRepository';
import { AuthService, AuthError } from '../authService';

const mockedUserRepo = UserRepository as jest.Mocked<typeof UserRepository>;
const mockedSessionRepo = SessionRepository as jest.Mocked<typeof SessionRepository>;
const mockedPasswordResetRepo = PasswordResetRepository as jest.Mocked<typeof PasswordResetRepository>;

const mockUser = {
  id: '123',
  name: 'Test User',
  email: 'test@atlas.com',
  role: UserRole.RETAIL,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthService.login', () => {
  test('returns generic error for non-existent email (does not reveal email existence)', async () => {
    mockedUserRepo.findByEmail.mockResolvedValue(null);

    await expect(AuthService.login('nobody@atlas.com', 'password123'))
      .rejects.toThrow('Invalid email or password.');
  });

  test('returns generic error for wrong password (same message as non-existent email)', async () => {
    const hash = await bcrypt.hash('correctpassword', 10);
    mockedUserRepo.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: hash });

    await expect(AuthService.login('test@atlas.com', 'wrongpassword'))
      .rejects.toThrow('Invalid email or password.');
  });

  test('returns token and user on successful login', async () => {
    const hash = await bcrypt.hash('correctpassword', 10);
    mockedUserRepo.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: hash });
    mockedSessionRepo.create.mockResolvedValue('session-id');

    const result = await AuthService.login('test@atlas.com', 'correctpassword');

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('test@atlas.com');
    expect(mockedSessionRepo.create).toHaveBeenCalled();
  });
});

describe('AuthService.register', () => {
  test('rejects duplicate email registration', async () => {
    mockedUserRepo.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: 'hash' });

    await expect(AuthService.register('New User', 'test@atlas.com', 'password123'))
      .rejects.toThrow('An account with this email already exists.');
  });

  test('rejects password shorter than 8 characters', async () => {
    mockedUserRepo.findByEmail.mockResolvedValue(null);

    await expect(AuthService.register('New User', 'new@atlas.com', 'short'))
      .rejects.toThrow('Password must be at least 8 characters.');
  });

  test('creates user and returns token on successful registration', async () => {
    mockedUserRepo.findByEmail.mockResolvedValue(null);
    mockedUserRepo.create.mockResolvedValue(mockUser);
    mockedSessionRepo.create.mockResolvedValue('session-id');

    const result = await AuthService.register('Test User', 'test@atlas.com', 'password123');

    expect(result.token).toBeDefined();
    expect(result.user.name).toBe('Test User');
    expect(mockedUserRepo.create).toHaveBeenCalled();
  });
});

describe('AuthService.resetPassword', () => {
  test('rejects already-used reset token', async () => {
    mockedPasswordResetRepo.findByToken.mockResolvedValue({
      id: 'reset-1',
      userId: '123',
      expiresAt: new Date(Date.now() + 3600000),
      used: true,
    });

    await expect(AuthService.resetPassword('some-token', 'newpassword123'))
      .rejects.toThrow('This reset link has already been used.');
  });

  test('rejects expired reset token', async () => {
    mockedPasswordResetRepo.findByToken.mockResolvedValue({
      id: 'reset-1',
      userId: '123',
      expiresAt: new Date(Date.now() - 3600000), // expired 1 hour ago
      used: false,
    });

    await expect(AuthService.resetPassword('some-token', 'newpassword123'))
      .rejects.toThrow('This reset link has expired.');
  });

  test('rejects invalid reset token', async () => {
    mockedPasswordResetRepo.findByToken.mockResolvedValue(null);

    await expect(AuthService.resetPassword('bad-token', 'newpassword123'))
      .rejects.toThrow('Invalid or expired reset token.');
  });

  test('successfully resets password and invalidates sessions', async () => {
    mockedPasswordResetRepo.findByToken.mockResolvedValue({
      id: 'reset-1',
      userId: '123',
      expiresAt: new Date(Date.now() + 3600000),
      used: false,
    });
    mockedUserRepo.updatePassword.mockResolvedValue();
    mockedPasswordResetRepo.markUsed.mockResolvedValue();
    mockedSessionRepo.invalidateAllForUser.mockResolvedValue();

    await AuthService.resetPassword('valid-token', 'newpassword123');

    expect(mockedUserRepo.updatePassword).toHaveBeenCalledWith('123', expect.any(String));
    expect(mockedPasswordResetRepo.markUsed).toHaveBeenCalledWith('reset-1');
    expect(mockedSessionRepo.invalidateAllForUser).toHaveBeenCalledWith('123');
  });
});

describe('AuthService.requestPasswordReset', () => {
  test('does not throw for non-existent email (prevents email enumeration)', async () => {
    mockedUserRepo.findByEmail.mockResolvedValue(null);

    // Should not throw — silently succeeds
    await expect(AuthService.requestPasswordReset('nobody@atlas.com')).resolves.toBeUndefined();
  });
});
