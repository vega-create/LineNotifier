// client/src/lib/queryClient.ts

import { QueryClient } from "@tanstack/react-query";

// React Query 全域快取 Client
export const queryClient = new QueryClient();

// API Base URL
const BASE_URL =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || ""; // 去掉尾端斜線避免 //api

// 封裝 API 請求方法
export async function apiRequest<T = any>(
  method: string,
  path: string,
  data?: any
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}
