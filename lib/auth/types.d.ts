import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "SUPER_ADMIN" | "TEACHER";
  }

  interface Session {
    user: {
      id: string;
      role: "SUPER_ADMIN" | "TEACHER";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "SUPER_ADMIN" | "TEACHER";
  }
}
