import type { VideoFileObject } from '../types';

export function isVideoFileObject(object: unknown): object is VideoFileObject {
  return (
    object !== null &&
    typeof object === 'object' &&
    'file' in object &&
    'videoMetadata' in object &&
    object.file instanceof File &&
    typeof object.videoMetadata === 'object'
  );
}

export function isVideoFileObjects(array: unknown): array is VideoFileObject[] {
  return Array.isArray(array) && array.every((item) => isVideoFileObject(item));
}
