import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "./mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// Define the role type to match what's expected
type UserRole = "user" | "admin" | "company_owner";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();
        
        const user = await User.findOne({ email: credentials.email });
        
        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Fix the type assertion here
        session.user.role = token.role as UserRole;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
