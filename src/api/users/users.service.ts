import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RegisterDTO, RegisterResponseDTO } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from './users.repository';
import { handleError } from 'src/utils/error/handler/generic.handler';
import { AuditService } from 'src/common/modules/audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * @param registerDTO Contains the Register Information like name, email, password and so on
   * Handles user registration and returns user information.
   */
  async register(registerDTO: RegisterDTO): Promise<RegisterResponseDTO> {
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(registerDTO.password, 10);

      // Check if the email already exists
      const existingUser = await this.userRepository.findByEmail(
        registerDTO.email,
      );

      if (existingUser) throw new ConflictException('Email already in use.');

      // Check if phone number already exists (if provided)
      if (registerDTO.phoneNumber) {
        const existingPhone = await this.userRepository.findByPhoneNumber(
          registerDTO.phoneNumber,
        );

        if (existingPhone)
          throw new ConflictException('Phone number already in use.');
      }

      // Create the new user
      const user = await this.userRepository.createUser({
        firstName: registerDTO.firstName,
        lastName: registerDTO.lastName,
        email: registerDTO.email,
        password: hashedPassword,
        phoneNumber: registerDTO.phoneNumber,
      });

      // Handle user creation failure
      if (!user) {
        this.logger.error('Error during user creation in service.');
        throw new InternalServerErrorException(
          'Error during user creation in service.',
        );
      }

      // Log the audit event
      await this.auditService.log({
        userId: user.id,
        performedById: user.id, // Self-registration
        action: AuditAction.CREATE,
        entityType: 'User',
        entityId: user.id,
        newValues: {
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });

      // Prepare and return the response DTO
      return RegisterResponseDTO.fromEntity(user);
    } catch (error: unknown) {
      this.logger.error(
        `There was an error during user registration: ${error}`,
      );
      handleError(error, 'Error during user registration in service.');
    }
  }
}
