import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER";
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  /** Obrigatória para usuários novos; ignorada se o email já existe (só
   *  adiciona membership). */
  password?: string;
  role?: "ADMIN" | "MANAGER";
}

export interface ApiUserLookup {
  exists: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    hasMembershipInCurrentTenant: boolean;
    otherMemberships: Array<{ tenantSlug: string; tenantName: string }>;
  } | null;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
  role?: "ADMIN" | "MANAGER";
}

const QUERY_KEY = ["users"] as const;

export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<ApiUser[]>("/users"),
    staleTime: 30_000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      apiFetch<ApiUser>("/users", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Lookup de email — usado pelo form de criação pra detectar se já existe
 * conta no sistema (em qualquer mesa). Returna `exists: false` quando email
 * não bate ou está em formato inválido. Debounce no caller.
 */
export function useUserLookup(email: string, enabled: boolean) {
  return useQuery({
    queryKey: ["users", "lookup", email],
    queryFn: () =>
      apiFetch<ApiUserLookup>(`/users/lookup?email=${encodeURIComponent(email)}`),
    enabled: enabled && email.length > 0 && /^.+@.+\..+$/.test(email),
    staleTime: 10_000,
    retry: false,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      apiFetch<ApiUser>(`/users/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<null>(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
