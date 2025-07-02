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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!userRole || (userRole !== "admin" && userRole !== "moderator")) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center rounded-xl">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-red-200">
          <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
          <p className="text-red-600">
            You don't have permission to view this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 rounded-xl">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 leading-tight">
              User Management
            </h1>
          </div>
          <p className="text-slate-600 text-lg ml-16">
            Manage users, roles, and permissions
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Debounce search
                    const timeoutId = setTimeout(() => fetchUsers(), 500);
                    return () => clearTimeout(timeoutId);
                  }}
                  className="pl-10 h-9 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={roleFilter === "all" ? "default" : "outline"}
                onClick={() => setRoleFilter("all")}
                className={`h-9 px-4 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${
                  roleFilter === "all"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
                }`}
              >
                All Users
              </Button>
              <Button
                variant={roleFilter === "user" ? "default" : "outline"}
                onClick={() => setRoleFilter("user")}
                className={`h-9 px-4 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${
                  roleFilter === "user"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
                }`}
              >
                Users
              </Button>
              <Button
                variant={roleFilter === "moderator" ? "default" : "outline"}
                onClick={() => setRoleFilter("moderator")}
                className={`h-9 px-4 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${
                  roleFilter === "moderator"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
                }`}
              >
                Moderators
              </Button>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md border border-slate-200">
              <div className="p-3 bg-slate-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-600 mb-1">
                No Users Found
              </h3>
              <p className="text-sm text-slate-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            users.map((user) => (
              <Card
                key={user.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-800 mb-1">
                          {user.display_name || user.username}
                        </h3>
                        <p className="text-slate-600 text-sm mb-2">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : user.role === "moderator"
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)}
                          </span>
                          {(user.banned || user.is_disabled) && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                              {user.banned ? "Banned" : "Disabled"}
                            </span>
                          )}
                          <span className="text-xs text-slate-500">
                            Joined {formatDate(user.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {userRole === "admin" && user.role !== "admin" && (
                    <div className="flex gap-2 ml-4">
                      {!user.banned ? (
                        <Button
                          onClick={() => handleUserAction(user.id, "ban")}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <UserX className="h-3 w-3 mr-1.5" />
                          Ban
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUserAction(user.id, "unban")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <UserCheck className="h-3 w-3 mr-1.5" />
                          Unban
                        </Button>
                      )}

                      {user.role === "user" && (
                        <Button
                          onClick={() =>
                            handleUserAction(user.id, "promote_mod")
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <Shield className="h-3 w-3 mr-1.5" />
                          Make Mod
                        </Button>
                      )}

                      {user.role === "moderator" && (
                        <>
                          <Button
                            onClick={() =>
                              handleUserAction(user.id, "promote_admin")
                            }
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <Shield className="h-3 w-3 mr-1.5" />
                            Make Admin
                          </Button>
                          <Button
                            onClick={() => handleUserAction(user.id, "demote")}
                            className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <Shield className="h-3 w-3 mr-1.5" />
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
