import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type { AdminBannersResponse, UpdateBannerBody } from "./types";

const BASE = "/admin/settings/banners";

export async function getAdminBanners() {
  return apiGet<AdminBannersResponse>(BASE);
}

export async function uploadAdminBanners(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return apiPost<AdminBannersResponse, FormData>(BASE, formData);
}

export async function updateAdminBanner(bannerId: string, body: UpdateBannerBody) {
  return apiPatch<AdminBannersResponse, UpdateBannerBody>(`${BASE}/${bannerId}`, body);
}

export async function reorderAdminBanners(ids: string[]) {
  return apiPut<AdminBannersResponse, { ids: string[] }>(`${BASE}/order`, { ids });
}

export async function deleteAdminBanner(bannerId: string) {
  return apiDelete<AdminBannersResponse>(`${BASE}/${bannerId}`);
}
