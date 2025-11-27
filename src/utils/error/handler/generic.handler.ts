import { HttpException, InternalServerErrorException } from "@nestjs/common";

export function handleError(
  error: unknown,
  contextMessage = "An error occurred",
): never {
  if (error instanceof HttpException) {
    throw error;
  }

  // For unexpected errors, throw a generic internal server error
  throw new InternalServerErrorException(contextMessage);
}
