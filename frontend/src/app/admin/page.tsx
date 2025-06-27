"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TopMenu from "@/components/TopMenu";
import { Volume2, VolumeX, Maximize2 } from "lucide-react";
import { getSupabaseClient, getPublicVideoUrl, getStatusColor } from "@/lib/supabase";

interface VideoState {
  url: string;
  isMuted: boolean;
  isPlaying: boolean;
  isFullscreen: boolean;
}

type VideoStates = {
  [key: string]: VideoState;
};

type Video = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  status: 'pending' | 'verified' | 'flagged' | 'processing' | 'rejected';
  user: {
    id: string;
    display_name: string;
    email: string;
  };
  created_at: string;
};

type User = {
  id: string;
  email: string;
  display_name: string;
  role: 'user' | 'moderator' | 'admin';
  banned: boolean;
  created_at: string;
};

export default function AdminDashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'moderator' | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoStates, setVideoStates] = useState<VideoStates>({});
  const supabase = createClient();

  const videoRefs = useRef<{[key: string]: HTMLVideoElement}>({});
  const videoContainerRefs = useRef<{[key: string]: HTMLDivElement}>({});

  const fetchVideos = async () => {
    try {
      const { data: videosData, error: videosError } = await supabase
        .from('sign_videos')
        .select(`
          id,
          title,
          description,
          video_url,
          status,
          created_at,
          user:users!user_id (
            id,
            display_name,
            email
          )
        `)
        .eq('status', 'processing')
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;

      const mappedVideos = videosData?.map(video => ({
        ...video,
        user: Array.isArray(video.user) ? video.user[0] : video.user
      })) || [];

      // Initialize video states for new videos
      const newVideoStates = { ...videoStates };
      for (const video of mappedVideos) {
        if (!newVideoStates[video.id]) {
          newVideoStates[video.id] = {
            url: getPublicVideoUrl(video.video_url),
            isMuted: true,
            isPlaying: false,
            isFullscreen: false
          };
        }
      }
      setVideoStates(newVideoStates);
      setVideos(mappedVideos as Video[]);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
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
        setUserRole(userData.role as 'admin' | 'moderator');

        // Fetch initial data
        await Promise.all([
          fetchVideos(),
          userData.role === 'admin' ? fetchUsers() : Promise.resolve()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

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

    const usersSubscription = supabase
      .channel('users_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          if (userRole === 'admin') {
            fetchUsers();
          }
        }
      )
      .subscribe();

    return () => {
      videosSubscription.unsubscribe();
      usersSubscription.unsubscribe();
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

      // Get the current video status first
      const { data: currentVideo, error: videoFetchError } = await supabase
        .from('sign_videos')
        .select('status')
        .eq('id', videoId)
        .single();

      if (videoFetchError) {
        console.error('Error fetching video:', videoFetchError);
        toast.error('Failed to fetch video status');
        return;
      }

      if (!currentVideo) {
        toast.error('Video not found');
        return;
      }

      console.log('Current video status:', currentVideo.status);
      console.log('Attempting to update video to:', action === 'approve' ? 'verified' : 'rejected');

      // Update the video status
      const { error: updateError } = await supabase
        .from('sign_videos')
        .update({ 
          status: action === 'approve' ? 'verified' : 'rejected'
        })
        .eq('id', videoId);

      if (updateError) {
        console.error('Error updating video status:', updateError);
        toast.error('Failed to update video status. Please try again.');
        return;
      }

      toast.success(`Video ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      
      // Verify the update was successful
      const { data: updatedVideo, error: verifyError } = await supabase
        .from('sign_videos')
        .select('status')
        .eq('id', videoId)
        .single();

      if (verifyError || !updatedVideo) {
        console.error('Error verifying update:', verifyError);
      } else {
        console.log('New video status:', updatedVideo.status);
      }

      // Fetch updated videos list
      await fetchVideos();
    } catch (error) {
      console.error('Error in handleVideoAction:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleUserBan = async (userId: string, currentBanStatus: boolean) => {
    if (userRole !== 'admin') {
      toast.error('Only administrators can ban users');
      return;
    }

    try {
      // Update user's ban status
      const { error: banError } = await supabase
        .from('users')
        .update({ banned: !currentBanStatus })
        .eq('id', userId);

      if (banError) throw banError;

      // If banning, also reject all pending videos from this user
      if (!currentBanStatus) {
        const { error: videoError } = await supabase
          .from('sign_videos')
          .update({ status: 'rejected' })
          .eq('user_id', userId)
          .eq('status', 'processing');

        if (videoError) throw videoError;
      }

      toast.success(`User ${currentBanStatus ? 'unbanned' : 'banned'} successfully`);
      
      // Fetch updated data
      await Promise.all([fetchUsers(), fetchVideos()]);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user status');
    }
  };

  // Video player functions
  const togglePlay = (videoId: string) => {
    const videoRef = videoRefs.current[videoId];
    const currentState = videoStates[videoId];
    if (videoRef && currentState) {
      if (currentState.isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
        // Automatically unmute when playing
        if (currentState.isMuted) {
          videoRef.muted = false;
          setVideoStates(prev => ({
            ...prev,
            [videoId]: {
              ...prev[videoId],
              isMuted: false
            }
          }));
        }
      }
      setVideoStates(prev => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          isPlaying: !currentState.isPlaying
        }
      }));
    }
  };

  const toggleMute = (videoId: string) => {
    const videoRef = videoRefs.current[videoId];
    const currentState = videoStates[videoId];
    if (videoRef && currentState) {
      videoRef.muted = !currentState.isMuted;
      setVideoStates(prev => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          isMuted: !currentState.isMuted
        }
      }));
    }
  };

  const toggleFullscreen = async (videoId: string) => {
    const containerRef = videoContainerRefs.current[videoId];
    const currentState = videoStates[videoId];
    if (!containerRef || !currentState) return;

    try {
      if (!currentState.isFullscreen) {
        if (containerRef.requestFullscreen) {
          await containerRef.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
      setVideoStates(prev => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          isFullscreen: !currentState.isFullscreen
        }
      }));
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setVideoStates(prev => {
        const newStates = { ...prev };
        let changed = false;
        for (const videoId in newStates) {
          if (newStates[videoId].isFullscreen !== !!document.fullscreenElement) {
            newStates[videoId] = {
              ...newStates[videoId],
              isFullscreen: !!document.fullscreenElement
            };
            changed = true;
          }
        }
        return changed ? newStates : prev;
      });
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Video Verification Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Video Verification ({videos.length} pending)</CardTitle>
            </CardHeader>
            <CardContent>
              {videos.length === 0 ? (
                <p className="text-gray-500">No pending videos to verify</p>
              ) : (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div key={video.id} className="p-4 bg-white rounded-lg shadow">
                      <h3 className="font-semibold">{video.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                      
                      {/* Video Player */}
                      <div 
                        ref={el => { if (el) videoContainerRefs.current[video.id] = el }}
                        className="relative aspect-video bg-black mt-2 rounded-lg overflow-hidden"
                      >
                        {videoStates[video.id]?.url && (
                          <video
                            ref={el => { if (el) videoRefs.current[video.id] = el }}
                            className="absolute top-0 left-0 w-full h-full object-contain cursor-pointer"
                            src={videoStates[video.id].url}
                            muted={videoStates[video.id].isMuted}
                            loop
                            playsInline
                            onClick={() => togglePlay(video.id)}
                          />
                        )}
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="bg-black/50 hover:bg-black/70 text-white rounded-full"
                            onClick={() => toggleMute(video.id)}
                          >
                            {videoStates[video.id]?.isMuted ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="bg-black/50 hover:bg-black/70 text-white rounded-full"
                            onClick={() => toggleFullscreen(video.id)}
                          >
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-500">
                        Uploaded by: {video.user.display_name}
                      </div>
                      <div className="mt-3 flex gap-2">
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Management Panel (Admin Only) */}
          {userRole === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 bg-white rounded-lg shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{user.display_name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'moderator'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                            {user.banned && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                                Banned
                              </span>
                            )}
                          </div>
                        </div>
                        {user.role !== 'admin' && (
                          <Button
                            onClick={() => handleUserBan(user.id, user.banned)}
                            variant={user.banned ? "outline" : "destructive"}
                            className={user.banned ? "hover:bg-green-50" : ""}
                          >
                            {user.banned ? 'Unban User' : 'Ban User'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 