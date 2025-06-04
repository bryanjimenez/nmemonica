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

export interface VoiceErrorObject {
  name: string;
  message: string;
  stack?: string;
  cause: { code: string; module: string };
}

export function isVoiceErrorObject(m: unknown): m is VoiceErrorObject {
  const test = m as VoiceErrorObject;
  return (
    (test.name === "Error" || test.name === "RuntimeError") &&
    typeof test.message === "string" &&
    typeof test.cause === "object"
  );
}

/**
 * Convert an unknown exception into Error
 */
export function exceptionToErrorObj(exception: unknown, origin?: string) {
  let error: VoiceErrorObject = {
    name: "Error",
    message: "Unknown exception" + origin !== undefined ? ` at ${origin}` : "",
    cause: {},
  };

  if (typeof exception === "string" && exception.length > 0) {
    try {
      // parse a serialized error
      error = JSON.parse(exception);
    } catch {
      error.message = exception;
    }
  } else if (
    exception instanceof Error ||
    (typeof exception === "object" && exception !== null)
  ) {
    if ("name" in exception) {
      error.name = (exception.name as string) ?? "Error";
    }
    if ("message" in exception) {
      error.message = exception.message as string;
    }
    if ("stack" in exception) {
      error.stack = exception.stack as string;
    }
    if (
      "cause" in exception &&
      exception.cause !== null &&
      typeof exception.cause === "object"
    ) {
      if (
        "code" in exception.cause &&
        typeof exception.cause.code === "string"
      ) {
        error.cause.code = exception.cause.code;
      }

      if (
        "module" in exception.cause &&
        typeof exception.cause.module === "string"
      ) {
        error.cause.module = exception.cause.module;
      }
    }
  }

  return error;
}
