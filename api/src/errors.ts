/**
 * Default error messages for HTTP status codes
 */
export const ERROR_MESSAGES = {
    // 4xx Client Errors
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    
    // 5xx Server Errors
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
} as const;

/**
 * Get default error message for a status code
 * @param statusCode - HTTP status code
 * @returns Default error message or generic message if code not found
 */
export const getErrorMessage = (statusCode: number): string => {
    return ERROR_MESSAGES[statusCode as keyof typeof ERROR_MESSAGES] || "An unexpected error occurred";
};

/**
 * Create a standardized error response object
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @returns Error response object
 */
export const createErrorResponse = (message: string, statusCode: number = 500) => {
    return {
        error: message,
        statusCode,
    };
};
