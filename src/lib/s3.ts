import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { Express, Request } from "express";
import crypto from "crypto";

import {
  AWS_S3_BUCKET_NAME,
  AWS_S3_BUCKET_REGION,
  AWS_S3_BUCKET_ACCESS_KEY,
  AWS_S3_BUCKET_SECRET_KEY,
} from "../config/env";

import {
  GetUrlParamsT,
  UploadCommandParamsT,
  DeleteCommandParamsT,
} from "../types/services/s3.types";

const s3_Client = new S3Client({
  credentials: {
    accessKeyId: AWS_S3_BUCKET_ACCESS_KEY,
    secretAccessKey: AWS_S3_BUCKET_SECRET_KEY,
  },
  region: AWS_S3_BUCKET_REGION,
});

class S3 {
  rootURL = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_S3_BUCKET_REGION}.amazonaws.com/`;

  async upload(params: UploadCommandParamsT) {
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: `${params.folder}/${params.filename}`,
      Body: params.buffer,
      ContentType: params.mimetype,
    });

    await s3_Client.send(command);
  }

  async delete(params: DeleteCommandParamsT) {
    const command = new DeleteObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: params.filename,
    });

    await s3_Client.send(command);
  }

  getURL(params: GetUrlParamsT) {
    return `${this.rootURL}${params.folder}/${params.filename}`;
  }

  // ========== PRODUCTS ==========
  async uploadProductAssets(req: Request): Promise<Array<string>> {
    try {
      const assets: Array<string> = [];
      const files = req.files as Express.Multer.File[];

      if (files.length > 0)
        await Promise.all(
          files.map(async (file): Promise<void> => {
            try {
              let mimetype: string = "";
              const folder: string = "assets";
              let buffer: Buffer = file.buffer;
              let filename: string = this.generateRandomFilename();

              if (file.mimetype.startsWith("video/")) {
                mimetype = "video/mp4";
                filename += ".mp4";
              } else {
                mimetype = "image/webp";
                filename += ".webp";

                buffer = await this.convertToWebp(file);
              }

              await this.upload({ folder, filename, mimetype, buffer });

              const url = this.getURL({ filename, folder });

              assets.push(url);
            } catch (error) {
              throw error;
            }
          })
        );

      return assets;
    } catch (error) {
      throw error;
    }
  }

  async deleteProductAssets(urlsToDelete: Array<string>) {
    try {
      await Promise.all(
        urlsToDelete.map(async (asset: string) => {
          try {
            const filename = asset.replace(this.rootURL, "");
            await this.delete({ filename });
          } catch (error) {
            throw error;
          }
        })
      );
    } catch (error) {
      throw error;
    }
  }

  // ========== UTILS ==========
  generateRandomFilename(): string {
    return `${Date.now()}-${crypto.randomBytes(32).toString("hex")}`;
  }

  async convertToWebp(file: Express.Multer.File): Promise<Buffer> {
    return await sharp(file.buffer).webp({ quality: 60 }).toBuffer();
  }
}

export default new S3();
