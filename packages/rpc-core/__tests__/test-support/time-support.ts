

export function waitMs(ms: number): Promise<any> {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

