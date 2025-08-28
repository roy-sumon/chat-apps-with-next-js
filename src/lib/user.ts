import { prisma } from '@/lib/prisma';

export const getUserByEmail = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    return user;
  } catch {
    return null;
  }
};

export const updateUserOnlineStatus = async (id: string, isOnline: boolean) => {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { 
        isOnline,
        lastSeen: isOnline ? undefined : new Date(),
      },
    });
    return user;
  } catch {
    return null;
  }
};