import { Injectable } from '@nestjs/common';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  getUploadPath(): string {
    return join(process.cwd(), 'uploads');
  }

  generateFilename(originalName: string): string {
    const ext = extname(originalName);
    const uniqueId = uuidv4();
    return `${uniqueId}${ext}`;
  }

  getFileUrl(filename: string, host: string): string {
    // Use consistent base URL for uploaded files
    // In dev: use the configured dev server IP
    // In prod: use the production domain
    const baseHost = process.env.NODE_ENV === 'production'
      ? 'api.poolside.app'
      : '10.243.20.219:3000';
    return `http://${baseHost}/uploads/${filename}`;
  }
}
