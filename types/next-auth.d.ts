import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "user" | "admin" | "company_owner" | null;
      companyId?: string | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: "user" | "admin" | "company_owner";
    companyId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: "user" | "admin" | "company_owner";
    companyId?: string | null;
  }
}