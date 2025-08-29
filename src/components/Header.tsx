
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, LayoutGrid, LogIn, LogOut } from 'lucide-react';

export default function Header() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = () => {
    // This function can only run on the client
    if (typeof window !== 'undefined') {
      setIsAdmin(sessionStorage.getItem('isAdminAuthenticated') === 'true');
    }
  };
  
  // Check on initial render and when route changes
  useEffect(() => {
    checkAuth();
  }, [pathname]);
  
  // Also listen for storage changes to sync across tabs
  useEffect(() => {
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);


  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    setIsAdmin(false);
    router.push('/'); // Redirect to home on logout
  };

  const publicLinks = [
    { href: '/', label: 'Home' },
  ];

  const adminLinks = [
    { href: '/', label: 'Dashboard' },
  ];

  const linksToShow = isAdmin ? adminLinks : publicLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <LayoutGrid className="h-6 w-6 text-primary" />
          <span className="font-semibold">SheetFlow</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {linksToShow.map((link) => (
            <Link key={link.href} href={link.href} className="text-foreground/80 transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
          {isAdmin && (
             <Link href="/admin" className="text-foreground/80 transition-colors hover:text-foreground">
                Admin Panel
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
           <Button asChild className="hidden md:flex">
            <Link href="/tickets/new">Create New Ticket</Link>
          </Button>

          {isAdmin ? (
            <Button onClick={handleLogout} variant="outline" size="sm" className="hidden md:flex">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden md:flex">
              <Link href="/admin">
                <LogIn className="mr-2 h-4 w-4" />
                Admin Login
              </Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex-1">
                  <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4 border-b pb-4">
                      <LayoutGrid className="h-6 w-6 text-primary" />
                      <span className="font-semibold">SheetFlow</span>
                  </Link>
                  <nav className="grid gap-6 text-lg font-medium mt-8">
                    {linksToShow.map((link) => (
                        <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
                        {link.label}
                        </Link>
                    ))}
                     {isAdmin && (
                        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                            Admin Panel
                        </Link>
                    )}
                  </nav>
                </div>
                <div className="mt-auto p-4 space-y-4 border-t">
                   <Button asChild className="w-full">
                     <Link href="/tickets/new">Create New Ticket</Link>
                   </Button>
                   {isAdmin ? (
                      <Button onClick={handleLogout} variant="outline" className="w-full">
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                      </Button>
                    ) : (
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/admin">
                          <LogIn className="mr-2 h-4 w-4" />
                          Admin Login
                        </Link>
                      </Button>
                    )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
