import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
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

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { content } = messageSchema.parse(body);
    
    const conversationId = params.conversationId;
    const currentUserId = session.user.id;

    // Check if the user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: currentUserId
          }
        }
      },
    });

    if (!conversation) {
      return new NextResponse('Conversation not found', { status: 404 });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: currentUserId,
      },
      include: {
        sender: true
      }
    });

    // Update the conversation's lastMessageAt
    await prisma.conversation.update({
      where: {
        id: conversationId
      },
      data: {
        lastMessageAt: new Date()
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