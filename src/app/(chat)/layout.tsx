import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/sidebar';
import { getUserById } from '@/lib/user';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = await getUserById(session.user.id);  
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="hidden md:block">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}