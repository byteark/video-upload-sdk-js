import {
  UploadJob,
  UploadManagerOptions,
} from '../types';
import { TusUploader } from './tus-generic';

export function createTusUploader(
  job: UploadJob,
  options: UploadManagerOptions,
  authorizationToken: string,
): TusUploader {
  return new TusUploader(job, options, authorizationToken, async(file: unknown) => {
    if (file instanceof File) {
      return {
        file: file,
        fileName: file.name,
        fileType: file.type,
      };
    }
    if (file instanceof Blob) {
      return {
        file: file,
        fileName: "",
        fileType: file.type,
      }
    }
    throw new Error("Unexpected file type");
  });
}
