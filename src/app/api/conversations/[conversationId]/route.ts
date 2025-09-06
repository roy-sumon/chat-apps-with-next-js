import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    const { conversationId } = await params;

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const currentUserId = session.user.id;

    // Check if the user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        OR: [
          { userOneId: currentUserId },
          { userTwoId: currentUserId }
        ]
      },
      include: {
        userOne: true,
        userTwo: true
      }
    });

    if (!conversation) {
      return new NextResponse('Conversation not found', { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('[CONVERSATION_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}