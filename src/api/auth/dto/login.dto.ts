import { ApiProperty } from '@nestjs/swagger';
import { UserWithToken } from 'src/api/users/users.type';

// Login Request Validation DTO
export class LoginDTO {
  @ApiProperty({ example: 'johndoe@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'strong@password123', description: 'User password' })
  password: string;
}

export class LoginResponseDTO {
  @ApiProperty({
    example: '1234567890',
    description: 'User ID',
  })
  id: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full Name',
  })
  name: string;

  @ApiProperty({
    example: 'John',
    description: 'First Name',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last Name',
  })
  lastName: string | null;

  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'User email',
  })
  email: string;

  @ApiProperty({
    example: 'USER',
    description: 'User role',
  })
  role: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    description: 'JWT token',
  })
  accessToken: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    description: 'Refresh token',
  })
  refreshToken: string;

  constructor(
    id: string,
    firstName: string,
    lastName: string | null,
    email: string,
    role: string,
    accessToken: string,
    refreshToken: string,
  ) {
    this.id = id;
    this.name = `${firstName} ${lastName ?? ''}`.trim();
    this.firstName = firstName;
    this.lastName = lastName ?? '';
    this.email = email;
    this.role = role;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  static fromEntity(data: UserWithToken): LoginResponseDTO {
    const firstName = data.profile?.firstName ?? '';
    const lastName = data.profile?.lastName ?? null;
    return new LoginResponseDTO(
      data.id,
      firstName,
      lastName,
      data.email,
      data.role,
      data.accessToken,
      data.refreshToken,
    );
  }
}
