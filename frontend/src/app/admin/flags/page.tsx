"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Flag, CheckCircle, XCircle } from "lucide-react";

// Raw response type from Supabase
type RawVideoFlag = {
  id: string;
  video_id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  video: {
    id: string;
    title: string;
    video_url: string;
    user: Array<{
      display_name: string;
    }>;
  };
  reporter: Array<{
    display_name: string;
  }>;
};

// Processed flag type for our UI
type Flag = {
  id: string;
  video_id: string;
  user_id: string;
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
  reporter: {
    display_name: string;
  };
};

export default function FlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Flag['status'] | 'all'>('all');
  const [videoStates, setVideoStates] = useState<{[key: string]: string}>({});
  const supabase = createClient();

  const fetchFlags = async () => {
    try {
      let query = supabase
        .from('video_flags')
        .select(`
          id,
          video_id,
          user_id,
          reason,
          status,
          created_at,
          video:sign_videos!inner (
            id,
            title,
            video_url,
            user:users!inner (
              display_name
            )
          ),
          reporter:users!inner (
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: flagsError } = await query;

      if (flagsError) throw flagsError;

      if (!data) {
        setFlags([]);
        return;
      }

      // Transform the data to match our Flag type
      const rawFlags = data as unknown as RawVideoFlag[];
      const mappedFlags: Flag[] = rawFlags.map(flag => ({
        ...flag,
        video: {
          ...flag.video,
          user: flag.video.user[0]
        },
        reporter: flag.reporter[0]
      }));

      // Initialize video states for new videos
      const newVideoStates = { ...videoStates };
      for (const flag of mappedFlags) {
        if (!newVideoStates[flag.video.id]) {
          // Get public URL for the video
          const [bucket, ...pathParts] = flag.video.video_url.split("/");
          const path = pathParts.join("/");
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          newVideoStates[flag.video.id] = data.publicUrl;
        }
      }
      setVideoStates(newVideoStates);

      // Filter flags by search query
      const filteredFlags = searchQuery
        ? mappedFlags.filter(flag =>
            flag.video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            flag.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
            flag.reporter.display_name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : mappedFlags;

      setFlags(filteredFlags);
    } catch (error) {
      console.error('Error fetching flags:', error);
      toast.error('Failed to load flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [statusFilter]); // Refetch when status filter changes

  useEffect(() => {
    // Set up real-time subscriptions
    const flagsSubscription = supabase
      .channel('video_flags_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'video_flags' },
        () => {
          fetchFlags();
        }
      )
      .subscribe();

    return () => {
      flagsSubscription.unsubscribe();
    };
  }, []);

  const handleFlagAction = async (flagId: string, action: 'resolve' | 'dismiss') => {
    try {
      // First verify that the user has the correct role
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

      if (userError || !userData || (userData.role !== 'admin' && userData.role !== 'moderator')) {
        toast.error('You do not have permission to perform this action');
        return;
      }

      const { error: updateError } = await supabase
        .from('video_flags')
        .update({ 
          status: action === 'resolve' ? 'resolved' : 'dismissed'
        })
        .eq('id', flagId);

      if (updateError) {
        console.error('Error updating flag status:', updateError);
        toast.error('Failed to update flag status');
        return;
      }

      toast.success(`Flag ${action === 'resolve' ? 'resolved' : 'dismissed'} successfully`);
      await fetchFlags();
    } catch (error) {
      console.error('Error in handleFlagAction:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const getStatusColor = (status: Flag['status']) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Flagged Content</h1>
        
        {/* Filters and Search */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search flags..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Debounce search
                  const timeoutId = setTimeout(() => fetchFlags(), 500);
                  return () => clearTimeout(timeoutId);
                }}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
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
          </div>
        </div>

        {/* Flags Grid */}
        <div className="grid grid-cols-1 gap-4">
          {flags.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No flags found</p>
            </div>
          ) : (
            flags.map((flag) => (
              <Card key={flag.id} className="p-6">
                <div className="flex gap-6">
                  {/* Video Preview */}
                  <div className="w-64 h-36 bg-black rounded-lg overflow-hidden flex-shrink-0">
                    {videoStates[flag.video.id] && (
                      <video
                        src={videoStates[flag.video.id]}
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
                          <p className="font-medium">Reported by {flag.reporter.display_name}</p>
                        </div>
                        <p className="text-sm text-red-700">{flag.reason}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Reported on: {new Date(flag.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {flag.status === 'pending' && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={() => handleFlagAction(flag.id, 'resolve')}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleFlagAction(flag.id, 'dismiss')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 