const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
