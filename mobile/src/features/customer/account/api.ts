import { apiGet, apiPatch } from "@/lib/api";

// The customer's own details as the SHOP sees them on their orders.
export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
};

export type UpdateCustomerProfileBody = {
  name?: string;
  phone?: string;
};

export async function getCustomerProfile() {
  return apiGet<CustomerProfile>("/customer/profile");
}

export async function updateCustomerProfile(body: UpdateCustomerProfileBody) {
  return apiPatch<CustomerProfile, UpdateCustomerProfileBody>(
    "/customer/profile",
    body,
  );
}
