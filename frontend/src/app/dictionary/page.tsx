'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { toast } from 'sonner'

type Video = Database['public']['Tables']['sign_videos']['Row']

export default function DictionaryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [videos, setVideos] = useState<Video[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // First, try to parse the natural language query using Vertex AI
      const response = await fetch('/api/parse-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })
      const { keyword } = await response.json()

      // Then search the database using the extracted keyword
      const { data, error } = await supabase
        .from('sign_videos')
        .select('*')
        .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,tags.cs.{${keyword}}`)
        .eq('status', 'verified')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideos(data || [])
    } catch (error) {
      console.error('Error searching videos:', error)
      toast.error('Failed to search videos')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Sign Language Dictionary</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              type="text"
              placeholder="Search for signs (e.g., 'How do you say sorry in Thai SL?')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card
            key={video.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/videos/${video.id}`)}
          >
            <CardHeader>
              <CardTitle className="line-clamp-2">{video.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {video.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && !isSearching && (
        <div className="text-center text-muted-foreground mt-8">
          No videos found. Try a different search term.
        </div>
      )}
    </div>
  )
} 