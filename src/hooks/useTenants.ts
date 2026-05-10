import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getAuthToken } from "@/api/client";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  fullName: string;
  brandConfig: Record<string, unknown>;
  isAdminOrg: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantInput {
  slug: string;
  name: string;
  fullName: string;
  brandConfig?: Record<string, unknown>;
  isAdminOrg?: boolean;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

export interface UpdateTenantInput {
  name?: string;
  fullName?: string;
  brandConfig?: Record<string, unknown>;
  active?: boolean;
}

const QUERY_KEY = ["tenants"] as const;

export function useTenants() {
  const token = getAuthToken();
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<Tenant[]>("/admin/tenants"),
    enabled: Boolean(token),
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantInput) =>
      apiFetch<Tenant>("/admin/tenants", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTenantInput & { id: string }) =>
      apiFetch<Tenant>(`/admin/tenants/${id}`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useUploadTenantLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      const token = getAuthToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:3001/api"}/admin/tenants/${id}/logo`,
        {
          method: "POST",
          body: form,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload falhou (${res.status})`);
      }
      return res.json() as Promise<{ logoUrl: string }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
