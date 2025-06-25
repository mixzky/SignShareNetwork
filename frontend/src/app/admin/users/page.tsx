"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, UserX, UserCheck, Shield } from "lucide-react";

type User = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: 'user' | 'moderator' | 'admin';
  banned: boolean | null;
  created_at: string;
  username: string;
  avatar_url: string | null;
  is_disabled: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'all'>('all');
  const [userRole, setUserRole] = useState<'admin' | 'moderator' | null>(null);
  const supabase = createClient();

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('users')
        .select('id, email, display_name, role, banned, created_at, username, avatar_url, is_disabled')
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data: usersData, error: usersError } = await query;

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      // Filter users by search query
      const filteredUsers = searchQuery
        ? (usersData as User[]).filter(user =>
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : usersData as User[];

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // Get current user's role
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        
        if (userData.role !== 'admin' && userData.role !== 'moderator') {
          throw new Error('Insufficient permissions');
        }
        
        setUserRole(userData.role as 'admin' | 'moderator');
        await fetchUsers();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load users data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Set up real-time subscription
    const usersSubscription = supabase
      .channel('users_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      usersSubscription.unsubscribe();
    };
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchUsers();
    }
  }, [roleFilter, searchQuery]);

  const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'promote_mod' | 'promote_admin' | 'demote') => {
    try {
      // First verify that the current user is an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to perform this action');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || !userData || userData.role !== 'admin') {
        toast.error('You do not have permission to perform this action');
        return;
      }

      let updateData: Partial<User> = {};
      let successMessage = '';
      
      switch (action) {
        case 'ban':
          updateData = { 
            banned: true,
            is_disabled: true, // Also disable the account
            role: 'user' // Demote banned users to regular users
          };
          successMessage = 'User has been banned';
          break;
        case 'unban':
          updateData = { 
            banned: false,
            is_disabled: false // Re-enable the account
          };
          successMessage = 'User has been unbanned';
          break;
        case 'promote_mod':
          updateData = { 
            role: 'moderator',
            banned: false,
            is_disabled: false
          };
          successMessage = 'User has been promoted to moderator';
          break;
        case 'promote_admin':
          updateData = { 
            role: 'admin',
            banned: false,
            is_disabled: false
          };
          successMessage = 'User has been promoted to administrator';
          break;
        case 'demote':
          updateData = { 
            role: 'user'
          };
          successMessage = 'User has been demoted to regular user';
          break;
      }

      console.log('Updating user with data:', { userId, updateData });

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user:', updateError);
        toast.error('Failed to update user: ' + updateError.message);
        return;
      }

      toast.success(successMessage);
    } catch (error) {
      console.error('Error in handleUserAction:', error);
      toast.error('An unexpected error occurred');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!userRole || (userRole !== 'admin' && userRole !== 'moderator')) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">User Management</h1>
        
        {/* Filters and Search */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Debounce search
                  const timeoutId = setTimeout(() => fetchUsers(), 500);
                  return () => clearTimeout(timeoutId);
                }}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={roleFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setRoleFilter('all')}
            >
              All
            </Button>
            <Button
              variant={roleFilter === 'user' ? 'default' : 'outline'}
              onClick={() => setRoleFilter('user')}
            >
              Users
            </Button>
            <Button
              variant={roleFilter === 'moderator' ? 'default' : 'outline'}
              onClick={() => setRoleFilter('moderator')}
            >
              Moderators
            </Button>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 gap-4">
          {users.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            users.map((user) => (
              <Card key={user.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{user.display_name || user.username}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'moderator'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                        {(user.banned || user.is_disabled) && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {user.banned ? 'Banned' : 'Disabled'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {userRole === 'admin' && user.role !== 'admin' && (
                    <div className="flex gap-2">
                      {!user.banned ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'ban')}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Ban User
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'unban')}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Unban User
                        </Button>
                      )}

                      {user.role === 'user' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'promote_mod')}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Promote to Mod
                        </Button>
                      )}

                      {user.role === 'moderator' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'promote_admin')}
                            className="text-purple-600 border-purple-600 hover:bg-purple-50"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Promote to Admin
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'demote')}
                            className="text-gray-600 border-gray-600 hover:bg-gray-50"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Remove Mod
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 