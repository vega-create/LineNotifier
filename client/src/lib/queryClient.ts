// client/src/lib/queryClient.ts

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || ""; // 去掉尾端斜線避免 //api

export async function apiRequest(
  method: string,
  path: string,
  data?: any
): Promise<Response> {
  const url = `${BASE_URL}${path}`;

  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(url, options);

  // 自動處理 4xx / 5xx 的錯誤（讓你前端 UI 顯示錯誤）
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }

  return res;
}
