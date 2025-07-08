"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, UserX, UserCheck, Shield } from "lucide-react";
import { formatDate } from "@/lib/supabase";

type User = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "user" | "moderator" | "admin";
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
  const [roleFilter, setRoleFilter] = useState<User["role"] | "all">("all");
  const [userRole, setUserRole] = useState<"admin" | "moderator" | null>(null);
  const supabase = createClient();

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from("users")
        .select(
          "id, email, display_name, role, banned, created_at, username, avatar_url, is_disabled"
        )
        .order("created_at", { ascending: false });

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      const { data: usersData, error: usersError } = await query;

      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw usersError;
      }

      // Filter users by search query
      const filteredUsers = searchQuery
        ? (usersData as User[]).filter(
            (user) =>
              user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.display_name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              user.username.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : (usersData as User[]);

      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // Get current user's role
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;

        if (userData.role !== "admin" && userData.role !== "moderator") {
          throw new Error("Insufficient permissions");
        }

        setUserRole(userData.role as "admin" | "moderator");
        await fetchUsers();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load users data");
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Set up real-time subscription
    const usersSubscription = supabase
      .channel("users_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
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

  const handleUserAction = async (
    userId: string,
    action: "ban" | "unban" | "promote_mod" | "promote_admin" | "demote"
  ) => {
    try {
      // First verify that the current user is an admin
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to perform this action");
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userError || !userData || userData.role !== "admin") {
        toast.error("You do not have permission to perform this action");
        return;
      }

      let updateData: Partial<User> = {};
      let successMessage = "";

      switch (action) {
        case "ban":
          updateData = {
            banned: true,
            is_disabled: true, // Also disable the account
            role: "user", // Demote banned users to regular users
          };
          successMessage = "User has been banned";
          break;
        case "unban":
          updateData = {
            banned: false,
            is_disabled: false, // Re-enable the account
          };
          successMessage = "User has been unbanned";
          break;
        case "promote_mod":
          updateData = {
            role: "moderator",
            banned: false,
            is_disabled: false,
          };
          successMessage = "User has been promoted to moderator";
          break;
        case "promote_admin":
          updateData = {
            role: "admin",
            banned: false,
            is_disabled: false,
          };
          successMessage = "User has been promoted to administrator";
          break;
        case "demote":
          updateData = {
            role: "user",
          };
          successMessage = "User has been demoted to regular user";
          break;
      }

      console.log("Updating user with data:", { userId, updateData });

      const { error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating user:", updateError);
        toast.error("Failed to update user: " + updateError.message);
        return;
      }

      toast.success(successMessage);
    } catch (error) {
      console.error("Error in handleUserAction:", error);
      toast.error("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="status">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
            aria-hidden="true"
          ></div>
          <p className="text-slate-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!userRole || (userRole !== "admin" && userRole !== "moderator")) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center rounded-xl">
        <div 
          className="text-center bg-white rounded-2xl p-8 shadow-lg border border-red-200"
          role="alert"
          aria-live="assertive"
        >
          <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-700 mb-2">Access Denied</h3>
          <p className="text-red-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        
        {/* Search and Filter Controls */}
        <div 
          className="flex flex-col md:flex-row gap-4 mb-6"
          role="search"
          aria-label="User search and filter controls"
        >
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search users</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <Input
                id="search"
                type="search"
                placeholder="Search by email, name, or username..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search users"
              />
            </div>
          </div>
          <div>
            <label htmlFor="role-filter" className="sr-only">Filter by role</label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as User["role"] | "all")}
              className="w-full md:w-auto px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter users by role"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="moderator">Moderators</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        <div 
          className="grid gap-4"
          role="region"
          aria-label="Users list"
        >
          {users.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium">
                    {user.display_name || user.username}
                    {user.banned && (
                      <span 
                        className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                        role="status"
                      >
                        Banned
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  <p className="text-sm text-slate-500">
                    <span className="font-medium">Role:</span> {user.role}
                  </p>
                  <p className="text-sm text-slate-500">
                    <span className="font-medium">Joined:</span> {formatDate(user.created_at)}
                  </p>
                </div>

                {/* User Actions */}
                {userRole === "admin" && (
                  <div 
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label={`Actions for ${user.display_name || user.username}`}
                  >
                    {user.banned ? (
                      <Button
                        onClick={() => handleUserAction(user.id, "unban")}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        aria-label={`Unban ${user.display_name || user.username}`}
                      >
                        <UserCheck className="w-4 h-4" aria-hidden="true" />
                        Unban
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUserAction(user.id, "ban")}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        aria-label={`Ban ${user.display_name || user.username}`}
                      >
                        <UserX className="w-4 h-4" aria-hidden="true" />
                        Ban
                      </Button>
                    )}

                    {user.role === "user" && (
                      <>
                        <Button
                          onClick={() => handleUserAction(user.id, "promote_mod")}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          aria-label={`Promote ${user.display_name || user.username} to moderator`}
                        >
                          <Shield className="w-4 h-4" aria-hidden="true" />
                          Make Moderator
                        </Button>
                        <Button
                          onClick={() => handleUserAction(user.id, "promote_admin")}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          aria-label={`Promote ${user.display_name || user.username} to administrator`}
                        >
                          <Shield className="w-4 h-4" aria-hidden="true" />
                          Make Admin
                        </Button>
                      </>
                    )}

                    {(user.role === "moderator" || user.role === "admin") && (
                      <Button
                        onClick={() => handleUserAction(user.id, "demote")}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        aria-label={`Demote ${user.display_name || user.username} to regular user`}
                      >
                        <Shield className="w-4 h-4" aria-hidden="true" />
                        Remove Role
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
