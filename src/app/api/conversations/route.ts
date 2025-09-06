import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const conversationSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { email } = conversationSchema.parse(body);
    const currentUserId = session.user.id;

    // Don't allow creating conversations with yourself
    if (session.user.email === email) {
      return new NextResponse('Cannot create conversation with yourself', { status: 400 });
    }

    // Find the user to start a conversation with
    const user = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if a conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            AND: [
              { userOneId: currentUserId },
              { userTwoId: user.id }
            ]
          },
          {
            AND: [
              { userOneId: user.id },
              { userTwoId: currentUserId }
            ]
          }
        ]
      },
      include: {
        userOne: true,
        userTwo: true,
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    // Create a new conversation
    const conversation = await prisma.conversation.create({
      data: {
        userOneId: currentUserId,
        userTwoId: user.id
      },
      include: {
        userOne: true,
        userTwo: true,
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    return NextResponse.json(conversation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }
    
    console.error('[CONVERSATION_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const currentUserId = session.user.id;

    // Get all conversations for the current user
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userOneId: currentUserId },
          { userTwoId: currentUserId }
        ]
      },
      include: {
        userOne: true,
        userTwo: true,
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('[CONVERSATIONS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}