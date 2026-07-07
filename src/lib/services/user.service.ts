import { hash, compare } from "bcrypt";
import { prisma } from "@/lib/prisma";
import type { MinecraftAccount } from "@prisma/client";

interface UserFilters {
  email?: string;
  username?: string;
  isActive?: boolean;
  roleId?: string;
}

interface CreateUserData {
  email: string;
  username: string;
  password: string;
  displayName: string;
  isActive?: boolean;
}

interface UpdateUserData {
  email?: string;
  username?: string;
  displayName?: string;
  isActive?: boolean;
}

/**
 * Service for user management
 */
export class UserService {
  private static readonly BCRYPT_ROUNDS = 12;

  /**
   * Create a new user with hashed password
   */
  static async createUser(data: CreateUserData): Promise<any> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase() },
          { username: data.username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      throw new Error(
        existingUser.email === data.email.toLowerCase()
          ? "User with this email already exists"
          : "Username is already taken"
      );
    }

    // Hash password
    const passwordHash = await hash(data.password, this.BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        username: data.username.toLowerCase(),
        displayName: data.displayName,
        passwordHash,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Get user by ID with relations
   */
  static async getUserById(id: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isActive: true,
        minecraftAccount: {
          select: {
            username: true,
            uuid: true,
            linkedAt: true,
          },
        },
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: {
                  select: {
                    permission: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Update user information
   */
  static async updateUser(id: string, data: UpdateUserData): Promise<any> {
    // Check if email is being changed and already exists
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email.toLowerCase(),
          id: { not: id },
        },
      });

      if (existingUser) {
        throw new Error("Email is already in use");
      }
    }

    // Check if username is being changed and already exists
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username.toLowerCase(),
          id: { not: id },
        },
      });

      if (existingUser) {
        throw new Error("Username is already taken");
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        email: data.email?.toLowerCase(),
        username: data.username?.toLowerCase(),
        displayName: data.displayName,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await hash(newPassword, this.BCRYPT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  /**
   * Link Minecraft account to user
   */
  static async linkMinecraftAccount(
    userId: string,
    username: string,
    uuid: string
  ): Promise<MinecraftAccount> {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      throw new Error("Invalid Minecraft UUID format");
    }

    // Check if UUID is already linked to another user
    const existingLink = await prisma.minecraftAccount.findFirst({
      where: {
        uuid: uuid.toLowerCase(),
        userId: { not: userId },
      },
    });

    if (existingLink) {
      throw new Error("This Minecraft account is already linked to another user");
    }

    const account = await prisma.minecraftAccount.upsert({
      where: { userId },
      create: {
        userId,
        username,
        uuid: uuid.toLowerCase(),
      },
      update: {
        username,
        uuid: uuid.toLowerCase(),
      },
      select: {
        username: true,
        uuid: true,
        linkedAt: true,
      },
    });

    return account as MinecraftAccount;
  }

  /**
   * Unlink Minecraft account from user
   */
  static async unlinkMinecraftAccount(userId: string): Promise<void> {
    await prisma.minecraftAccount.deleteMany({
      where: { userId },
    });
  }

  /**
   * Assign a role to a user
   */
  static async assignRole(userId: string, roleId: string): Promise<void> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    // Check if user already has this role
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existingAssignment) {
      throw new Error("User already has this role");
    }

    // Assign role
    await prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  /**
   * Remove a role from a user
   */
  static async removeRole(userId: string, roleId: string): Promise<void> {
    const result = await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    });

    if (result.count === 0) {
      throw new Error("User does not have this role");
    }
  }

  static async listUsers(
    filters: UserFilters = {},
    page: number = 1,
    limit: number = 50
  ) {
    // Validate pagination parameters
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.min(Math.max(1, Math.floor(limit)), 100); // Max 100 per page
    const skip = (validPage - 1) * validLimit;

    // Build where clause
    const where: any = {};

    if (filters.email) {
      where.email = {
        contains: filters.email,
        mode: "insensitive",
      };
    }

    if (filters.username) {
      where.username = {
        contains: filters.username,
        mode: "insensitive",
      };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.roleId) {
      where.roles = {
        some: {
          roleId: filters.roleId,
        },
      };
    }

    // Execute queries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          isActive: true,
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: validLimit,
      }),
      prisma.user.count({ where }),
    ]);

    const pages = Math.ceil(total / validLimit);

    return {
      data: users,
      total,
      page: validPage,
      limit: validLimit,
      pages,
    };
  }

  /**
   * Check if user has a specific permission
   */
  static async hasPermission(
    userId: string,
    permissionCode: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: {
          select: {
            role: {
              select: {
                permissions: {
                  select: {
                    permission: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Check if user has the permission through any of their roles
    for (const userRole of user.roles) {
      for (const rolePerm of userRole.role.permissions) {
        if (rolePerm.permission?.code === permissionCode) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: {
          select: {
            role: {
              select: {
                permissions: {
                  select: {
                    permission: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    const permissions = new Set<string>();

    for (const userRole of user.roles) {
      for (const rolePerm of userRole.role.permissions) {
        if (rolePerm.permission) {
          permissions.add(rolePerm.permission.code);
        }
      }
    }

    return Array.from(permissions);
  }
}
