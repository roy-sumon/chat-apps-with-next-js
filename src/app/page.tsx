import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Users, Shield } from 'lucide-react';

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="bg-background text-foreground border-b">
        <div className="container mx-auto px-6 py-16 max-w-5xl">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="md:w-1/2 space-y-5">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Real-time messaging for everyone
              </h1>
              <p className="text-base md:text-lg text-gray-600">
                Connect with friends, family, and colleagues instantly with our secure and intuitive chat platform.
              </p>
              
              {session ? (
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button size="default" asChild className="bg-blue-600 text-white hover:bg-blue-700">
                    <Link href="/conversations" className="flex items-center gap-2">
                      Go to conversations <ArrowRight size={16} />
                    </Link>
                  </Button>
                  <SignOutButton variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100" />
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button size="default" asChild className="bg-blue-600 text-white hover:bg-blue-700">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button size="default" asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <Link href="/register">Create account</Link>
                  </Button>
                </div>
              )}
            </div>
            
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-sm h-64 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MessageSquare size={80} className="text-blue-600/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-2xl font-medium text-center mb-10">Key Features</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 border rounded flex flex-col items-center text-center bg-card text-card-foreground">
              <MessageSquare size={22} className="text-primary mb-3" />
              <h3 className="text-lg font-medium mb-2">Real-time Messaging</h3>
              <p className="text-muted-foreground text-sm">Instant message delivery with typing indicators.</p>
            </div>
            
            <div className="p-5 border rounded flex flex-col items-center text-center bg-card text-card-foreground">
              <Users size={22} className="text-primary mb-3" />
              <h3 className="text-lg font-medium mb-2">Group Conversations</h3>
              <p className="text-muted-foreground text-sm">Create group chats with friends and team members.</p>
            </div>
            
            <div className="p-5 border rounded flex flex-col items-center text-center bg-card text-card-foreground">
              <Shield size={22} className="text-primary mb-3" />
              <h3 className="text-lg font-medium mb-2">Secure & Private</h3>
              <p className="text-muted-foreground text-sm">Your conversations are protected with security.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted text-muted-foreground py-6 mt-auto border-t">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-3 md:mb-0">
              <h2 className="text-base font-medium">My Chat App</h2>
              <p className="text-xs">© {new Date().getFullYear()} All rights reserved</p>
            </div>
            
            <div className="flex gap-5">
              <Link href="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                About
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
