import { NextRequest, NextResponse } from 'next/server';
import { initSocketServer } from '@/server/socket';

export async function GET(req: NextRequest) {
  // This is a workaround for Next.js App Router
  // We need to convert the NextRequest to a standard Node.js request
  const res = NextResponse.next();
  
  try {
    // @ts-ignore - This is a hack to get the socket server working with App Router
    initSocketServer(req, res);
    
    return new NextResponse('Socket server initialized', { status: 200 });
  } catch (error) {
    console.error('Socket initialization error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}