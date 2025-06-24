"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { LayoutDashboard, Video, Users, Flag, ChevronRight } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error || !userData) {
          console.error('Error fetching user role:', error);
          router.push('/');
          return;
        }

        if (userData.role !== 'admin' && userData.role !== 'moderator') {
          router.push('/');
          return;
        }

        setUserRole(userData.role);
      } catch (error) {
        console.error('Error checking access:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'moderator']
    },
    {
      name: 'Videos',
      href: '/admin/videos',
      icon: Video,
      allowedRoles: ['admin', 'moderator']
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      allowedRoles: ['admin']
    },
    {
      name: 'Flags',
      href: '/admin/flags',
      icon: Flag,
      allowedRoles: ['admin', 'moderator']
    }
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
        </div>
        <nav className="mt-6">
          <div className="px-3 space-y-1">
            {navigation.map((item) => {
              const isAllowed = item.allowedRoles.includes(userRole as string);
              if (!isAllowed) return null;

              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-blue-700' : 'text-gray-400'
                  }`} />
                  {item.name}
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 text-blue-700" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="py-6 px-8">
          {children}
        </div>
      </div>
    </div>
  );
} 