import { apiGet } from "@/lib/api";
import type { AdminDashboardDaily, AdminDashboardLite } from "./types";

export async function getAdminDashboardLite() {
  return apiGet<AdminDashboardLite>("/admin/dashboard/lite");
}

export async function getAdminDashboardDaily() {
  return apiGet<AdminDashboardDaily>("/admin/dashboard/daily");
}
