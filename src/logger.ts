const PREFIX = "[tm-mf-pricing]";

/** Logs only in the debug build. */
export function debugLog(message: string): void {
  if (__DEBUG__) {
    console.log(`${PREFIX} ${message}`);
  }
}

/** Logs in every build so failures stay visible. */
export function logError(message: string, error: unknown): void {
  console.error(`${PREFIX} ${message}`, error);
}
