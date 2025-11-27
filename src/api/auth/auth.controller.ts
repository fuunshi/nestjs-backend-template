import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/auth.decorator';
import { AuthService } from './auth.service';
import { LoginDTO, LoginResponseDTO } from './dto/login.dto';
import { _FastifyRequest } from 'src/common/types/request.type';
import { RefreshDTO, RefreshResponseDTO } from './dto/refresh.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * This Method calls login service which handles the login logic.
   * @param loginDTO Login Data like email, password are validated and passed.
   * @returns Login response with user info and tokens.
   */
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: 200,
    description: 'Login Authentication',
    type: LoginResponseDTO,
  })
  async login(
    @Req() req: _FastifyRequest,
    @Body() loginDTO: LoginDTO,
  ): Promise<LoginResponseDTO> {
    const ipAddress: string = req.ip;
    const userAgent: string | undefined = req.headers['user-agent'];
    return await this.authService.login(ipAddress, userAgent, loginDTO);
  }

  /**
   * This Method calls logout service which handles the logout logic.
   * @returns void
   */
  @Post('logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({
    status: 200,
    description: 'Logout Authentication',
  })
  @ApiBearerAuth()
  async logout(@Req() req: _FastifyRequest): Promise<void> {
    const userId: string = req.user.userId;
    const userAgent: string | undefined = req.headers['user-agent'];
    return await this.authService.logout(userId, userAgent);
  }

  /**
   * This Method calls refresh token service which generates a new refresh token.
   * @returns A new access token and refresh token.
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh Token' })
  @ApiResponse({
    status: 200,
    description: 'Refresh Token',
    type: RefreshResponseDTO,
  })
  async refresh(
    @Req() req: _FastifyRequest,
    @Body() refreshTokenDTO: RefreshDTO,
  ): Promise<RefreshResponseDTO> {
    return await this.authService.refreshLoginToken(refreshTokenDTO);
  }
}
