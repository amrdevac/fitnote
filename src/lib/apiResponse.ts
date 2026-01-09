export type ApiResponseType<T = any> = {
  status: boolean; // true/false
  message: string; // standar message
  data?: T | null; // hasil data (optional)
};

const HTTP_MESSAGES: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  500: "Internal Server Error",
};

export default class ApiResponse {
  static success<T = any>(
    data: T,
    message: string = HTTP_MESSAGES[200],
    statusCode: number = 200
  ): Response {
    return new Response(
      JSON.stringify({
        status: true,
        message,
        data,
      } as ApiResponseType<T>),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  static error(message?: string, statusCode: number = 400): Response {
    return new Response(
      JSON.stringify({
        status: false,
        message: message || HTTP_MESSAGES[statusCode] || "Error",
        data: null,
      } as ApiResponseType<null>),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
