import { apiClient } from '../client';

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export const uploadsService = {
  async uploadImage(imageUri: string): Promise<UploadResponse> {
    // Create form data
    const formData = new FormData();

    // Get the file name from the URI
    const uriParts = imageUri.split('/');
    const fileName = uriParts[uriParts.length - 1];

    // Determine the file type
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = fileExtension === 'png' ? 'image/png' :
                     fileExtension === 'gif' ? 'image/gif' :
                     fileExtension === 'webp' ? 'image/webp' : 'image/jpeg';

    // Append the file to form data
    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any);

    const response = await apiClient.post<UploadResponse>('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
