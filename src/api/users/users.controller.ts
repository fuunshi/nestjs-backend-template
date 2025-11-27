import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDTO, RegisterResponseDTO } from './dto/register.dto';
import { Public } from 'src/common/decorators/auth.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  /**
   * Register User to the system
   * @param registerDTO User Details like name, email, phone number, email and so on
   * @returns User details
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register' })
  @ApiResponse({
    status: 200,
    description: 'Register Authentication',
    type: RegisterResponseDTO,
  })
  async register(
    @Body() registerDTO: RegisterDTO,
  ): Promise<RegisterResponseDTO> {
    return await this.userService.register(registerDTO);
  }
}
