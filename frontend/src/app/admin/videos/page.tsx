"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Filter } from "lucide-react";

type Video = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  status: 'pending' | 'verified' | 'flagged' | 'processing' | 'rejected';
  region: string;
  user: {
    id: string;
    display_name: string;
    email: string;
  };
  created_at: string;
  flags?: {
    reason: string;
    created_at: string;
  }[];
};

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Video['status'] | 'all'>('all');
  const [videoStates, setVideoStates] = useState<{[key: string]: {
    url: string;
    isMuted: boolean;
    isPlaying: boolean;
  }}>({});
  const supabase = createClient();

  const fetchVideos = async () => {
    try {
      let query = supabase
        .from('sign_videos')
        .select(`
          id,
          title,
          description,
          video_url,
          status,
          region,
          created_at,
          user:users!inner (
            id,
            display_name,
            email
          ),
          flags (
            id,
            reason,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: videosData, error: videosError } = await query;

      if (videosError) {
        console.error('Supabase query error:', videosError);
        throw videosError;
      }

      if (!videosData) {
        console.error('No data returned from query');
        throw new Error('No data returned from query');
      }

      const mappedVideos = videosData.map(video => ({
        ...video,
        user: Array.isArray(video.user) ? video.user[0] : video.user,
        flags: Array.isArray(video.flags) ? video.flags : []
      }));

      // Initialize video states for new videos
      const newVideoStates = { ...videoStates };
      for (const video of mappedVideos) {
        if (!newVideoStates[video.id]) {
          try {
            const [bucket, ...pathParts] = video.video_url.split("/");
            const path = pathParts.join("/");
            const { data } = supabase.storage.from(bucket).getPublicUrl(path);
            
            newVideoStates[video.id] = {
              url: data.publicUrl,
              isMuted: true,
              isPlaying: false
            };
          } catch (error) {
            console.error(`Error getting public URL for video ${video.id}:`, error);
          }
        }
      }
      setVideoStates(newVideoStates);

      // Filter videos by search query
      const filteredVideos = searchQuery
        ? mappedVideos.filter(video =>
            video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.region?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : mappedVideos;

      setVideos(filteredVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [statusFilter]); // Refetch when status filter changes

  useEffect(() => {
    // Set up real-time subscriptions
    const videosSubscription = supabase
      .channel('sign_videos_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sign_videos' },
        () => {
          fetchVideos();
        }
      )
      .subscribe();

    return () => {
      videosSubscription.unsubscribe();
    };
  }, []);

  const handleVideoAction = async (videoId: string, action: 'approve' | 'reject') => {
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

      if (userError) {
        console.error('Error fetching user role:', userError);
        toast.error('Failed to verify user permissions');
        return;
      }

      if (!userData || (userData.role !== 'admin' && userData.role !== 'moderator')) {
        toast.error('You do not have permission to perform this action');
        return;
      }

      const { error: updateError } = await supabase
        .from('sign_videos')
        .update({ 
          status: action === 'approve' ? 'verified' : 'rejected'
        })
        .eq('id', videoId);

      if (updateError) {
        console.error('Error updating video status:', updateError);
        toast.error('Failed to update video status');
        return;
      }

      toast.success(`Video ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      await fetchVideos();
    } catch (error) {
      console.error('Error in handleVideoAction:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const getStatusColor = (status: Video['status']) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'flagged':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Video Management</h1>
        
        {/* Filters and Search */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Debounce search
                  const timeoutId = setTimeout(() => fetchVideos(), 500);
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
              variant={statusFilter === 'processing' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('processing')}
            >
              Processing
            </Button>
            <Button
              variant={statusFilter === 'flagged' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('flagged')}
            >
              Flagged
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('rejected')}
            >
              Rejected
            </Button>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 gap-6">
          {videos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No videos found</p>
            </div>
          ) : (
            videos.map((video) => (
              <Card key={video.id}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Video Preview */}
                    <div className="w-64 h-36 bg-black rounded-lg overflow-hidden flex-shrink-0">
                      {videoStates[video.id]?.url && (
                        <video
                          src={videoStates[video.id].url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                    </div>

                    {/* Video Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{video.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
                          {video.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-500">Uploader:</span>{" "}
                          <span className="font-medium">{video.user.display_name}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Region:</span>{" "}
                          <span className="font-medium">{video.region}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Uploaded:</span>{" "}
                          <span className="font-medium">
                            {new Date(video.created_at).toLocaleDateString()}
                          </span>
                        </p>
                        {video.flags && video.flags.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-red-600">
                              {video.flags.length} flag(s)
                            </p>
                            <ul className="mt-1 space-y-1">
                              {video.flags.map((flag, index) => (
                                <li key={index} className="text-sm text-gray-600">
                                  {flag.reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {video.status === 'processing' && (
                        <div className="mt-4 flex gap-2">
                          <Button
                            onClick={() => handleVideoAction(video.id, 'approve')}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleVideoAction(video.id, 'reject')}
                            variant="destructive"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 