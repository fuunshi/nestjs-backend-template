import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import { Observable } from "rxjs";

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    if (!request.isMultipart()) {
      throw new Error("Request is not multipart");
    }

    // Get parts as an async iterator
    const parts = request.parts();
    const files: any[] = [];

    // Iterate through parts
    for await (const part of parts) {
      // Check if the part is a file
      if ((part as MultipartFile).file) {
        const chunks: any[] = [];
        // Collect the file chunks into a buffer
        for await (const chunk of (part as MultipartFile).file) {
          chunks.push(chunk);
        }
        files.push({
          buffer: Buffer.concat(chunks),
          mimetype: part.mimetype,
          filename: part.fieldname,
        });
      }
    }

    // Attach the files to the request body
    request.body = { files };
    return next.handle();
  }
}
