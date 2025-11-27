import { Injectable, Inject } from "@nestjs/common";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject("CLOUDINARY") private cloudinaryInstance: typeof cloudinary,
  ) {}

  async uploadImage(file: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "uploads" },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        },
      );

      const readableStream = Readable.from(file);
      readableStream.pipe(uploadStream);
    });
  }
}
