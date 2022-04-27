export function delay(durationMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, durationMs));
}

export function makeProgressPercent(uploadedBytes: number, totalBytes: number) {
  let percentTimes100 = uploadedBytes / totalBytes * 10000;
  percentTimes100 -= percentTimes100 % 1;

  return percentTimes100 / 100;
}
