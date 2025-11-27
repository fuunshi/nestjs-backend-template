import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { handleError } from 'src/utils/error/handler/generic.handler';
import { UserRepository, UserWithProfile } from '../users/users.repository';
import { LoginDTO, LoginResponseDTO } from './dto/login.dto';
import { AuthRepository } from './auth.repository';
import { RefreshDTO, RefreshResponseDTO } from './dto/refresh.dto';
import { TokenService } from 'src/common/modules/token/token.service';
import { AuditService } from 'src/common/modules/audit/audit.service';
import { AuditAction, TokenType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * @param ipAddress IP address of the user.
   * @param userAgent User agent of the user.
   * @param loginDTO Login DTO.
   * @returns LoginResponseDTO
   * @description Handles user login and returns a JWT token.
   */
  async login(
    ipAddress: string,
    userAgent: string = 'undefined',
    loginDTO: LoginDTO,
  ): Promise<LoginResponseDTO> {
    try {
      const user = await this.validateUser(loginDTO.email, loginDTO.password);
      
      // Update last login info
      await this.userRepository.updateLastLogin(user.id, ipAddress);

      const accessToken = this.generateJwt(user.id, user.role);
      const refreshToken = this.generateRefreshJwt(user.id);

      // Store tokens for revocation capability
      const accessExpiry = this.getTokenExpiry(this.configService.get<string>('auth.jwtExpiresIn') || '1d');
      const refreshExpiry = this.getTokenExpiry(this.configService.get<string>('auth.refreshTokenExpiresIn') || '7d');

      await Promise.all([
        this.tokenService.storeToken({
          userId: user.id,
          token: accessToken,
          type: TokenType.ACCESS,
          expiresAt: accessExpiry,
          ipAddress,
          userAgent,
        }),
        this.tokenService.storeToken({
          userId: user.id,
          token: refreshToken,
          type: TokenType.REFRESH,
          expiresAt: refreshExpiry,
          ipAddress,
          userAgent,
        }),
      ]);

      // Log login
      void this.authRepository.login({
        userId: user.id,
        ipAddress,
        userAgent,
      });

      // Audit log
      await this.auditService.log({
        userId: user.id,
        performedById: user.id,
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
      });

      return LoginResponseDTO.fromEntity({
        ...user,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      this.logger.error(`Error during login: ${error}`);
      handleError(error, 'Something went wrong.');
    }
  }

  /**
   * @param userId User ID.
   * @param userAgent User agent of the user.
   * @returns void
   * @description Handles user logout.
   */
  async logout(
    userId: string,
    userAgent: string = 'undefined',
    currentToken?: string,
  ): Promise<void> {
    try {
      // Revoke all tokens for this user
      await this.tokenService.revokeAllUserTokens(userId, 'User logout');

      await this.authRepository.logout({ userId, userAgent });

      // Audit log
      await this.auditService.log({
        userId,
        performedById: userId,
        action: AuditAction.LOGOUT,
        entityType: 'User',
        entityId: userId,
        userAgent,
      });
    } catch (error) {
      this.logger.error(`Error during logout: ${error}`);
      handleError(error, 'Something went wrong.');
    }
  }

  /**
   * Revoke all tokens for a user (force logout from all devices)
   */
  async revokeAllTokens(
    userId: string,
    performedById: string,
    reason?: string,
  ): Promise<number> {
    const count = await this.tokenService.revokeAllUserTokens(userId, reason);

    // Audit log
    await this.auditService.log({
      userId,
      performedById,
      action: AuditAction.TOKEN_REVOKE,
      entityType: 'Token',
      metadata: { reason, revokedCount: count },
    });

    return count;
  }

  async refreshLoginToken(
    refreshDTO: RefreshDTO,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RefreshResponseDTO> {
    const { refreshToken } = refreshDTO;

    // Check if token is revoked
    const isValid = await this.tokenService.verifyToken(refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const decoded = this.jwtService.decode(refreshToken);
    if (!decoded) throw new UnauthorizedException('Invalid refresh token');

    const userId = (decoded as Record<string, unknown>)['userId'] as string;
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid refresh token');

    // Revoke old refresh token
    await this.tokenService.revokeToken(refreshToken, 'Token refreshed');

    const newAccessToken = this.generateJwt(user.id, user.role);
    const newRefreshToken = this.generateRefreshJwt(user.id);

    // Store new tokens
    const accessExpiry = this.getTokenExpiry(this.configService.get<string>('auth.jwtExpiresIn') || '1d');
    const refreshExpiry = this.getTokenExpiry(this.configService.get<string>('auth.refreshTokenExpiresIn') || '7d');

    await Promise.all([
      this.tokenService.storeToken({
        userId: user.id,
        token: newAccessToken,
        type: TokenType.ACCESS,
        expiresAt: accessExpiry,
        ipAddress,
        userAgent,
      }),
      this.tokenService.storeToken({
        userId: user.id,
        token: newRefreshToken,
        type: TokenType.REFRESH,
        expiresAt: refreshExpiry,
        ipAddress,
        userAgent,
      }),
    ]);

    return RefreshResponseDTO.fromEntity({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  }

  /**
   * Validates user credentials and returns the user if valid.
   * @param email User email.
   * @param password User password.
   * @returns User with Profile
   */
  async validateUser(email: string, password: string): Promise<UserWithProfile> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account is temporarily locked due to too many failed login attempts',
      );
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.userRepository.incrementFailedLoginAttempts(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  /**
   * Compares a plain-text password with a hashed password.
   * @param plainText Plain-text password.
   * @param hashed Hashed password.
   * @returns Promise<boolean>
   */
  private async comparePassword(
    plainText: string,
    hashed: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }

  /**
   * Generates a JWT token for the user.
   * @param userId ID of user
   * @param role User role
   * @returns string
   */
  private generateJwt(userId: string, role: string): string {
    return this.jwtService.sign({ userId, role });
  }

  /**
   * Generates a refresh JWT token for the user.
   * @param userId ID of user
   * @returns string
   */
  private generateRefreshJwt(userId: string): string {
    return this.jwtService.sign(
      { userId, type: 'refresh' },
      {
        expiresIn: (this.configService.get<string>('auth.refreshTokenExpiresIn') || '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
  }

  /**
   * Calculate token expiry date from duration string
   */
  private getTokenExpiry(duration: string): Date {
    const now = new Date();
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default 1 day
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}
