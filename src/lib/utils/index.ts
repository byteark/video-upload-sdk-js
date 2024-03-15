import { SignJWT } from 'jose';

import { UploadJob } from '../types';

export async function signJWTToken(secret: string, validPeriodInHour: number) {
  const signSecret = new TextEncoder().encode(secret);

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${validPeriodInHour || 2}h`)
    .sign(signSecret);

  return token;
}

export function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

export function makeProgressPercent(uploadedBytes: number, totalBytes: number) {
  let percentTimes100 = (uploadedBytes / totalBytes) * 10000;
  percentTimes100 -= percentTimes100 % 1;

  return percentTimes100 / 100;
}

export function transformVideoObjectsToJobList(
  files: File[],
  videoKeys: string[],
): UploadJob[] {
  return videoKeys.map((videoKey, index) => ({
    uploadId: videoKey,
    file: files[index],
    name: files[index].name,
    status: 'pending',
  }));
}
