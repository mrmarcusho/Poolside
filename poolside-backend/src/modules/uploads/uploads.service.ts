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
    // Return the URL to access the uploaded file
    return `http://${host}/uploads/${filename}`;
  }
}
