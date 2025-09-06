import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const messageSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    const { conversationId } = await params;

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { content } = messageSchema.parse(body);
    
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
    });

    if (!conversation) {
      return new NextResponse('Conversation not found', { status: 404 });
    }

    // Determine receiver (the other user in the conversation)
    const receiverId = conversation.userOneId === currentUserId ? conversation.userTwoId : conversation.userOneId;

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: currentUserId,
        receiverId,
      },
      include: {
        sender: true
      }
    });

    // Update the conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: {
        id: conversationId
      },
      data: {
        updatedAt: new Date()
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }
    
    console.error('[MESSAGE_SEND]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}