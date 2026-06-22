import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Error: Faltan credenciales.");
          return null;
        }
        
        const emailClean = (credentials.email as string).trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email: emailClean }
        });
        
        if (!user) {
          console.log(`[Auth] Error: Usuario no encontrado en base de datos para: ${credentials.email}`);
          return null;
        }
        if (!user.active) {
          console.log(`[Auth] Error: El usuario ${credentials.email} está inactivo.`);
          return null;
        }
        
        const isMatch = await bcrypt.compare(credentials.password as string, user.password);
        if (!isMatch) {
          console.log(`[Auth] Error: Contraseña incorrecta para el usuario: ${credentials.email}`);
          return null;
        }
        
        console.log(`[Auth] Éxito: Usuario ${credentials.email} autorizado correctamente.`);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string | null;
      }
      return session;
    }
  }
});
