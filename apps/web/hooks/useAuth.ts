import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session } = useSession();

  const getToken = async () => {
    return session?.accessToken;
  };

  return {
    getToken,
    isAuthenticated: !!session,
    user: session?.user
  };
} 