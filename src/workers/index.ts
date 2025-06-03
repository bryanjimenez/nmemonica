export const AUDIO_WORKER_JA_NAME = "./voice-worker-ja.js";
export const AUDIO_WORKER_EN_NAME = "./voice-worker-en.js";

/**
 * Parse error stack for originating file
 * @param error
 * @returns Origin of error
 */
export function getStackInitial(error: { stack?: string }) {
  return (
    error.stack?.split("\n").slice(-1).pop()?.split("/").slice(-1).pop() ?? ""
  );
}

/**
 * Convert an unknown exception into Error
 */
export function exceptionToError(exception: unknown, origin?: string) {
  let error = new Error(
    "Unknown exception" + origin !== undefined ? ` at ${origin}` : ""
  );

  if (exception instanceof Error) {
    error = exception;
  } else if (typeof exception === "string" && exception.length > 0) {
    try {
      // parse a serialized error
      error = JSON.parse(exception) as Error;
    } catch {
      error.message = exception;
    }
  } else if (typeof exception === "object" && exception !== null) {
    if ("name" in exception) {
      error.name = (exception.name as string) ?? "Unknown error";
    }
    if ("message" in exception) {
      error.message = exception.message as string;
    }
    if ("stack" in exception) {
      error.stack = exception.stack as string;
    }
    if ("cause" in exception) {
      error.cause = exception.cause;
    }
  }

  return error;
}
