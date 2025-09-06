import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    const { userId } = await params;

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    console.error('[USER_STATUS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
