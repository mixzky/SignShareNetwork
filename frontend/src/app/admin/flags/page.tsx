"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Flag, CheckCircle, XCircle } from "lucide-react";
import { getStatusColor, formatDate } from "@/lib/supabase";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

// Raw response type from Supabase
type RawVideoFlag = {
  id: string;
  video_id: string;
  flagged_by: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  video: {
    id: string;
    title: string;
    video_url: string;
    user_id: string;
  };
  flagged_by_user?: {
    display_name: string;
  };
};

// Processed flag type for our UI
type Flag = {
  id: string;
  video_id: string;
  flagged_by: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  video: {
    id: string;
    title: string;
    video_url: string;
    user: {
      display_name: string;
    };
  };
  flagged_by_user?: {
    display_name: string;
  };
};

function FlagCard({
  flag,
  videoUrl,
  onResolve,
  onDismiss,
  updating,
}: {
  flag: Flag;
  videoUrl?: string;
  onResolve: () => void;
  onDismiss: () => void;
  updating: boolean;
}) {
  return (
    <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 p-4">
      <div className="flex gap-4">
        {/* Video Preview */}
        <div className="w-48 h-28 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0">
          {videoUrl && (
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              controls
            />
          )}
        </div>
        {/* Flag Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-800 mb-1">
                {flag.video.title}
              </h3>
              <p className="text-xs text-slate-600">
                Uploaded by:{" "}
                <span className="font-medium">
                  {flag.video.user.display_name}
                </span>
              </p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                flag.status
              )}`}
            >
              {flag.status.charAt(0).toUpperCase() + flag.status.slice(1)}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <Flag className="h-3 w-3" />
                <p className="font-medium text-xs">
                  Reported by {flag.flagged_by_user?.display_name}
                </p>
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                {flag.reason}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Reported on:{" "}
              <span className="font-medium">{formatDate(flag.created_at)}</span>
            </p>
          </div>
          {/* Action Buttons */}
          {flag.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <Button
                onClick={onResolve}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-medium cursor-pointer transition-all duration-200 text-xs h-7"
                disabled={updating}
                aria-label="Resolve flag"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {updating ? "Resolving..." : "Resolve"}
              </Button>
              <Button
                onClick={onDismiss}
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded-lg font-medium cursor-pointer transition-all duration-200 text-xs h-7"
                disabled={updating}
                aria-label="Dismiss flag"
              >
                <XCircle className="h-3 w-3 mr-1" />
                {updating ? "Dismissing..." : "Dismiss"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function FlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Flag["status"]>("pending");
  const [videoStates, setVideoStates] = useState<{ [key: string]: string }>({});
  const [updatingFlagId, setUpdatingFlagId] = useState<string | null>(null);
  const supabase = createClient();

  // Cache video URLs
  const getVideoUrl = useCallback(
    (flag: Flag) => {
      if (videoStates[flag.video.id]) return videoStates[flag.video.id];
      const [bucket, ...pathParts] = flag.video.video_url.split("/");
      const path = pathParts.join("/");
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },
    [videoStates, supabase]
  );

  const fetchFlags = async (status: Flag["status"]) => {
    try {
      let query = supabase
        .from("flags")
        .select(
          `
          id,
          video_id,
          flagged_by,
          reason,
          status,
          created_at,
          video:sign_videos (
            id,
            title,
            video_url,
            user_id
          )
        `
        )
        .order("created_at", { ascending: false })
        .eq("status", status);

      const { data, error: flagsError } = await query;
      if (flagsError) throw flagsError;
      if (!data) {
        setFlags([]);
        return;
      }

      // Get all unique flagged_by user ids
      const rawFlags = data as unknown as RawVideoFlag[];
      const userIds = Array.from(
        new Set(rawFlags.map((flag) => flag.flagged_by))
      );

      // Fetch user info for those ids
      let userMap: Record<string, { display_name: string }> = {};
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, display_name")
          .in("id", userIds);
        if (usersError) throw usersError;
        userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u]));
      }

      // Map user info to flags
      const mappedFlags: Flag[] = rawFlags.map((flag) => ({
        ...flag,
        video:
          flag.video &&
          typeof flag.video === "object" &&
          !Array.isArray(flag.video)
            ? {
                ...flag.video,
                user: userMap[flag.video.user_id] || {
                  display_name: "Unknown",
                },
              }
            : {
                id: "",
                title: "",
                video_url: "",
                user: { display_name: "Unknown" },
                user_id: "",
              },
        flagged_by_user: userMap[flag.flagged_by] || {
          display_name: "Unknown",
        },
      }));

      // Cache video URLs for new videos
      const newVideoStates = { ...videoStates };
      for (const flag of mappedFlags) {
        if (!newVideoStates[flag.video.id]) {
          const [bucket, ...pathParts] = flag.video.video_url.split("/");
          const path = pathParts.join("/");
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          newVideoStates[flag.video.id] = data.publicUrl;
        }
      }
      setVideoStates(newVideoStates);
      setFlags(mappedFlags);
    } catch (error) {
      console.error("Error fetching flags:", error);
      toast.error("Failed to load flags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    // Set up real-time subscriptions
    const flagsSubscription = supabase
      .channel("flags_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flags" },
        () => {
          fetchFlags(statusFilter);
        }
      )
      .subscribe();

    return () => {
      flagsSubscription.unsubscribe();
    };
  }, [statusFilter]);

  const handleFlagAction = async (
    flagId: string,
    action: "resolve" | "dismiss"
  ) => {
    try {
      setUpdatingFlagId(flagId);
      // First verify that the user has the correct role
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to perform this action");
        setUpdatingFlagId(null);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (
        userError ||
        !userData ||
        (userData.role !== "admin" && userData.role !== "moderator")
      ) {
        toast.error("You do not have permission to perform this action");
        setUpdatingFlagId(null);
        return;
      }

      const { error: updateError } = await supabase
        .from("flags")
        .update({
          status: action === "resolve" ? "resolved" : "dismissed",
        })
        .eq("id", flagId);

      if (updateError) {
        console.error("Error updating flag status:", updateError);
        toast.error("Failed to update flag status");
        setUpdatingFlagId(null);
        return;
      }

      toast.success(
        `Flag ${action === "resolve" ? "resolved" : "dismissed"} successfully`
      );
      await fetchFlags(statusFilter);
    } catch (error) {
      console.error("Error in handleFlagAction:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setUpdatingFlagId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 rounded-xl">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-600 rounded-xl shadow-sm">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Flagged Content
            </h1>
          </div>
          <p className="text-slate-600 text-sm ml-10">
            Review and moderate reported content
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
              className={`h-8 px-4 rounded-lg font-medium cursor-pointer transition-all duration-200 text-xs ${
                statusFilter === "pending"
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
              }`}
            >
              <Flag className="h-3 w-3 mr-1" />
              Pending
            </Button>
            <Button
              variant={statusFilter === "resolved" ? "default" : "outline"}
              onClick={() => setStatusFilter("resolved")}
              className={`h-8 px-4 rounded-lg font-medium cursor-pointer transition-all duration-200 text-xs ${
                statusFilter === "resolved"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
              }`}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Resolved
            </Button>
            <Button
              variant={statusFilter === "dismissed" ? "default" : "outline"}
              onClick={() => setStatusFilter("dismissed")}
              className={`h-8 px-4 rounded-lg font-medium cursor-pointer transition-all duration-200 text-xs ${
                statusFilter === "dismissed"
                  ? "bg-slate-600 hover:bg-slate-700 text-white shadow-sm"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
              }`}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Dismissed
            </Button>
          </div>
        </div>

        {/* Flags Grid */}
        <div className="space-y-3">
          {flags.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300 shadow-sm">
              <div className="p-3 bg-slate-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Flag className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-600 mb-1">
                No {statusFilter} Flags
              </h3>
              <p className="text-slate-500 text-sm">
                {statusFilter === "pending"
                  ? "No pending flags to review"
                  : `No ${statusFilter} flags found`}
              </p>
            </div>
          ) : (
            flags.map((flag) => (
              <FlagCard
                key={flag.id}
                flag={flag}
                videoUrl={getVideoUrl(flag)}
                onResolve={() => handleFlagAction(flag.id, "resolve")}
                onDismiss={() => handleFlagAction(flag.id, "dismiss")}
                updating={updatingFlagId === flag.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
