import { useQuery } from "@tanstack/react-query";
import { apiFetch, getAuthToken } from "@/api/client";

export interface ApiCurrentUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER";
}

const QUERY_KEY = ["currentUser"] as const;

export function useCurrentUser() {
  const token = getAuthToken();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<ApiCurrentUser>("/auth/me"),
    enabled: Boolean(token),
    staleTime: Infinity, // user data raramente muda durante a sessão
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    isAdmin: query.data?.role === "ADMIN",
  };
}
