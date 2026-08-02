import { apiPost } from "@/lib/api";

export async function registerAdminPushToken(token: string) {
  return apiPost<{ registered: boolean }, { token: string }>(
    "/admin/push-token",
    { token },
  );
}
