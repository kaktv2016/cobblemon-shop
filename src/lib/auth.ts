import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import {
  findAuthmePlayer,
  authmeVerify,
  updateAuthmeLastLogin,
} from "@/lib/authme";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      roles: string[];
    };
  }

  interface User {
    id: string;
    email: string;
    username: string;
    roles: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    username: string;
    roles: string[];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
        }

        // 1. Look up player in AuthMe database
        const authmePlayer = await findAuthmePlayer(credentials.username);
        if (!authmePlayer) {
          throw new Error("ไม่พบชื่อผู้ใช้นี้ในระบบ");
        }

        // 2. Verify password against AuthMe hash
        const isValid = authmeVerify(credentials.password, authmePlayer.password);
        if (!isValid) {
          throw new Error("รหัสผ่านไม่ถูกต้อง");
        }

        // 3. Find or create corresponding web user in cobbleshop DB
        const roleInclude = {
          roles: {
            select: {
              role: { select: { id: true, name: true } },
            },
          },
        } as const;

        // MySQL collation is typically case-insensitive by default
        let webUser = await prisma.user.findFirst({
          where: { username: authmePlayer.realname },
          include: roleInclude,
        });

        if (!webUser) {
          // Auto-create web user from AuthMe data
          const playerRole = await prisma.role.findUnique({
            where: { name: "player" },
          });

          webUser = await prisma.user.create({
            data: {
              email: authmePlayer.email || `${authmePlayer.realname}@authme.local`,
              username: authmePlayer.realname,
              passwordHash: "AUTHME_MANAGED", // Password is managed by AuthMe
              isActive: true,
              roles: playerRole
                ? { create: { roleId: playerRole.id } }
                : undefined,
            },
            include: roleInclude,
          });
        }

        if (!webUser.isActive) {
          throw new Error("บัญชีนี้ถูกระงับการใช้งาน");
        }

        // 4. Update AuthMe last login
        try {
          await updateAuthmeLastLogin(authmePlayer.username);
        } catch {
          // Non-critical, don't block login
        }

        return {
          id: webUser.id,
          email: webUser.email,
          username: webUser.username,
          roles: webUser.roles.map(
            (ur: { role: { id: string; name: string } }) => ur.role.name
          ),
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 1 day
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.roles = user.roles;
      } else if (token.id) {
        // Refresh roles on every token validation
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: {
            roles: {
              select: {
                role: { select: { name: true } },
              },
            },
          },
        });

        if (currentUser) {
          token.roles = currentUser.roles.map((ur) => ur.role.name);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.username = token.username;
        session.user.roles = token.roles;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  events: {
    async signIn({ user }) {
      if (user?.id) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              userEmail: user.email || "",
              action: "LOGIN",
              target: "AUTH",
              targetId: user.id,
            },
          });
        } catch (error) {
          console.error("Failed to log sign-in event:", error);
        }
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
