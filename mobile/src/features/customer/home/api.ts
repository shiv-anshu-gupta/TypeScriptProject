/**
 * The one request the Home screen makes.
 *
 * @packageDocumentation
 */

import { apiGet } from "@/lib/api";
import type { CustomerHomeResponse } from "./types";

/**
 * `GET /customer/home` — banners, categories, newest products and coupons in
 * one payload.
 *
 * @remarks
 * Public: it needs no token and works signed out, which is what lets Home
 * render while Clerk is still loading. One request rather than four, because
 * Home shows all of it at once and a cheap phone on a slow connection should
 * make one round trip.
 *
 * @returns The whole Home payload; any section can be empty.
 * @throws Error When the request fails. The store keeps what is on screen
 * rather than showing the message.
 */
export async function getCustomerHomeDateOverview() {
  return apiGet<CustomerHomeResponse>("/customer/home");
}
