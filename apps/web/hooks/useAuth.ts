import { useSession } from "next-auth/react";
import { Session } from "next-auth";

// Extend Session type to include accessToken
interface CustomSession extends Session {
  accessToken?: string;
}

export function useAuth() {
  const { data: session } = useSession() as { data: CustomSession | null };

  const getToken = async () => {
    return session?.accessToken;
  };

  return {
    getToken,
    isAuthenticated: !!session,
    user: session?.user,
  };
}
