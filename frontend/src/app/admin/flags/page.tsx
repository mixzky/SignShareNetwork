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
  status: 'pending' | 'resolved' | 'dismissed';
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
  status: 'pending' | 'resolved' | 'dismissed';
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

function FlagCard({ flag, videoUrl, onResolve, onDismiss, updating }: {
  flag: Flag;
  videoUrl?: string;
  onResolve: () => void;
  onDismiss: () => void;
  updating: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex gap-6">
        {/* Video Preview */}
        <div className="w-64 h-36 bg-black rounded-lg overflow-hidden flex-shrink-0">
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
              <h3 className="font-semibold text-lg">{flag.video.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Uploaded by: {flag.video.user.display_name}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(flag.status)}`}>
              {flag.status}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <Flag className="h-4 w-4" />
                <p className="font-medium">Reported by {flag.flagged_by_user?.display_name}</p>
              </div>
              <p className="text-sm text-red-700">{flag.reason}</p>
            </div>
            <p className="text-sm text-gray-500">
              Reported on: {formatDate(flag.created_at)}
            </p>
          </div>
          {/* Action Buttons */}
          {flag.status === 'pending' && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={onResolve}
                className="bg-green-500 hover:bg-green-600"
                disabled={updating}
                aria-label="Resolve flag"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {updating ? 'Resolving...' : 'Resolve'}
              </Button>
              <Button
                variant="outline"
                onClick={onDismiss}
                disabled={updating}
                aria-label="Dismiss flag"
              >
                <XCircle className="h-4 w-4 mr-1" />
                {updating ? 'Dismissing...' : 'Dismiss'}
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
  const [statusFilter, setStatusFilter] = useState<Flag['status']>('pending');
  const [videoStates, setVideoStates] = useState<{[key: string]: string}>({});
  const [updatingFlagId, setUpdatingFlagId] = useState<string | null>(null);
  const supabase = createClient();

  // Cache video URLs
  const getVideoUrl = useCallback((flag: Flag) => {
    if (videoStates[flag.video.id]) return videoStates[flag.video.id];
    const [bucket, ...pathParts] = flag.video.video_url.split("/");
    const path = pathParts.join("/");
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }, [videoStates, supabase]);

  const fetchFlags = async (status: Flag['status']) => {
    try {
      let query = supabase
        .from('flags')
        .select(`
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
        `)
        .order('created_at', { ascending: false })
        .eq('status', status);

      const { data, error: flagsError } = await query;
      if (flagsError) throw flagsError;
      if (!data) {
        setFlags([]);
        return;
      }

      // Get all unique flagged_by user ids
      const rawFlags = data as unknown as RawVideoFlag[];
      const userIds = Array.from(new Set(rawFlags.map(flag => flag.flagged_by)));

      // Fetch user info for those ids
      let userMap: Record<string, { display_name: string }> = {};
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, display_name')
          .in('id', userIds);
        if (usersError) throw usersError;
        userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u]));
      }

      // Map user info to flags
      const mappedFlags: Flag[] = rawFlags.map(flag => ({
        ...flag,
        video: flag.video && typeof flag.video === 'object' && !Array.isArray(flag.video)
          ? {
              ...flag.video,
              user: userMap[flag.video.user_id] || { display_name: 'Unknown' }
            }
          : {
              id: '',
              title: '',
              video_url: '',
              user: { display_name: 'Unknown' },
              user_id: ''
            },
        flagged_by_user: userMap[flag.flagged_by] || { display_name: 'Unknown' }
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
      console.error('Error fetching flags:', error);
      toast.error('Failed to load flags');
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
      .channel('flags_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'flags' },
        () => {
          fetchFlags(statusFilter);
        }
      )
      .subscribe();

    return () => {
      flagsSubscription.unsubscribe();
    };
  }, [statusFilter]);

  const handleFlagAction = async (flagId: string, action: 'resolve' | 'dismiss') => {
    try {
      setUpdatingFlagId(flagId);
      // First verify that the user has the correct role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to perform this action');
        setUpdatingFlagId(null);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || !userData || (userData.role !== 'admin' && userData.role !== 'moderator')) {
        toast.error('You do not have permission to perform this action');
        setUpdatingFlagId(null);
        return;
      }

      const { error: updateError } = await supabase
        .from('flags')
        .update({ 
          status: action === 'resolve' ? 'resolved' : 'dismissed'
        })
        .eq('id', flagId);

      if (updateError) {
        console.error('Error updating flag status:', updateError);
        toast.error('Failed to update flag status');
        setUpdatingFlagId(null);
        return;
      }

      toast.success(`Flag ${action === 'resolve' ? 'resolved' : 'dismissed'} successfully`);
      await fetchFlags(statusFilter);
    } catch (error) {
      console.error('Error in handleFlagAction:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setUpdatingFlagId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner className="h-32" size={48} />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Flagged Content</h1>
        {/* Status Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'resolved' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved
          </Button>
          <Button
            variant={statusFilter === 'dismissed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('dismissed')}
          >
            Dismissed
          </Button>
        </div>
        {/* Flags Grid */}
        <div className="grid grid-cols-1 gap-4">
          {flags.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No pending flags found</p>
            </div>
          ) : (
            flags.map((flag) => (
              <FlagCard
                key={flag.id}
                flag={flag}
                videoUrl={getVideoUrl(flag)}
                onResolve={() => handleFlagAction(flag.id, 'resolve')}
                onDismiss={() => handleFlagAction(flag.id, 'dismiss')}
                updating={updatingFlagId === flag.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 