import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-semibold text-gray-500">Select a conversation or start a new one</h1>
        </div>
      </div>
    </div>
  );
}