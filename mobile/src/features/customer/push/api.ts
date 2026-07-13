import { apiDelete, apiPost } from "@/lib/api";

export async function savePushToken(token: string) {
  return apiPost<{ registered: boolean }, { token: string }>(
    "/customer/push-token",
    { token },
  );
}

export async function removePushToken(token: string) {
  return apiDelete<{ registered: boolean }>("/customer/push-token", {
    data: { token },
  });
}
