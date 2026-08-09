import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    roles?: string[];
    parishId?: string | null;
    vicariatId?: string | null;
    paroisseName?: string | null;
    sessionId?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles?: string[];
      parishId?: string | null;
      vicariatId?: string | null;
      paroisseName?: string | null;
      sessionId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: string[];
    parishId?: string | null;
    vicariatId?: string | null;
    paroisseName?: string | null;
    sessionId?: string;
  }
}
