import { useState, useCallback } from "react";

/**
 * Interface for error objects in Pilfer
 */
export interface PilferError {
  message: string;
  code?: string;
  severity: "low" | "medium" | "high" | "critical";
  recoverable: boolean;
  context?: any;
  timestamp: number;
}

/**
 * Hook for centralized error handling and recovery
 */
export const useErrorHandler = () => {
  const [error, setError] = useState<PilferError | null>(null);

  const handleError = useCallback(
    (
      error: unknown,
      severity: PilferError["severity"] = "medium",
      context?: any
    ) => {
      console.error("[Pilfer Error]", error, context);

      let message = "An unexpected error occurred.";
      let code = "UNKNOWN_ERROR";
      let recoverable = true;

      if (error instanceof Error) {
        message = error.message;
        code = error.name;
      } else if (typeof error === "string") {
        message = error;
      }

      // Analyze error for recoverability and specific handling
      if (message.includes("429")) {
        message =
          "Rate limit exceeded. Please wait a moment before trying again.";
        code = "RATE_LIMIT";
        recoverable = true;
      } else if (
        message.includes("Network Error") ||
        message.includes("fetch")
      ) {
        message =
          "Network connection issue. Please check your internet connection.";
        code = "NETWORK_ERROR";
        recoverable = true;
      } else if (message.includes("API key")) {
        message = "Invalid or missing API key. Please check your settings.";
        code = "AUTH_ERROR";
        severity = "critical";
        recoverable = false;
      }

      setError({
        message,
        code,
        severity,
        recoverable,
        context,
        timestamp: Date.now(),
      });
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
};
