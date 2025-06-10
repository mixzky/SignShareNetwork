'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { toast } from 'sonner'

type Video = Database['public']['Tables']['sign_videos']['Row']
type Flag = Database['public']['Tables']['flags']['Row']

export default function ModerationPage() {
  const [videos, setVideos] = useState<(Video & { flags: Flag[] })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    checkUserRole()
    fetchFlaggedVideos()
  }, [])

  const checkUserRole = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (!['admin', 'moderator'].includes(userData.role)) {
        router.push('/')
        toast.error('You do not have permission to access this page')
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      router.push('/')
      toast.error('Failed to verify permissions')
    }
  }

  const fetchFlaggedVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('sign_videos')
        .select(`
          *,
          flags (*)
        `)
        .eq('status', 'flagged')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideos(data)
    } catch (error) {
      console.error('Error fetching flagged videos:', error)
      toast.error('Failed to load flagged videos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleModerate = async (videoId: string, action: 'verify' | 'delete') => {
    try {
      if (action === 'verify') {
        const { error } = await supabase
          .from('sign_videos')
          .update({ status: 'verified' })
          .eq('id', videoId)

        if (error) throw error
        toast.success('Video verified successfully')
      } else {
        const { error } = await supabase
          .from('sign_videos')
          .delete()
          .eq('id', videoId)

        if (error) throw error
        toast.success('Video deleted successfully')
      }

      fetchFlaggedVideos() // Refresh the list
    } catch (error) {
      console.error('Error moderating video:', error)
      toast.error('Failed to moderate video')
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Moderation Dashboard</h1>

      <div className="space-y-6">
        {videos.map((video) => (
          <Card key={video.id}>
            <CardHeader>
              <CardTitle className="line-clamp-2">{video.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {video.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {video.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Flags</h3>
                {video.flags.map((flag) => (
                  <div
                    key={flag.id}
                    className="bg-destructive/10 p-4 rounded-lg"
                  >
                    <p className="text-sm mb-2">
                      <strong>Reason:</strong> {flag.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Flagged on {new Date(flag.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/videos/${video.id}`)}
                >
                  View Video
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleModerate(video.id, 'verify')}
                >
                  Verify Video
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleModerate(video.id, 'delete')}
                >
                  Delete Video
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {videos.length === 0 && (
          <p className="text-muted-foreground text-center">
            No flagged videos to moderate.
          </p>
        )}
      </div>
    </div>
  )
} 