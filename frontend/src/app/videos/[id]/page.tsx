'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { toast } from 'sonner'

type Video = Database['public']['Tables']['sign_videos']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Comment is required'),
})

type ReviewFormData = z.infer<typeof reviewSchema>

export default function VideoPage() {
  const { id } = useParams()
  const [video, setVideo] = useState<Video | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewSummary, setReviewSummary] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  })

  useEffect(() => {
    fetchVideoAndReviews()
  }, [id])

  const fetchVideoAndReviews = async () => {
    try {
      // Fetch video
      const { data: videoData, error: videoError } = await supabase
        .from('sign_videos')
        .select('*')
        .eq('id', id)
        .single()

      if (videoError) throw videoError
      setVideo(videoData)

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('video_id', id)
        .order('created_at', { ascending: false })

      if (reviewsError) throw reviewsError
      setReviews(reviewsData)

      // Generate review summary if there are reviews
      if (reviewsData.length > 0) {
        const response = await fetch('/api/generate-review-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviews: reviewsData }),
        })
        const { summary } = await response.json()
        setReviewSummary(summary)
      }
    } catch (error) {
      console.error('Error fetching video and reviews:', error)
      toast.error('Failed to load video')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ReviewFormData) => {
    try {
      const { error } = await supabase.from('reviews').insert({
        video_id: id,
        rating: data.rating,
        comment: data.comment,
      })

      if (error) throw error

      toast.success('Review submitted successfully')
      reset()
      fetchVideoAndReviews() // Refresh reviews and summary
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  if (!video) {
    return <div className="container mx-auto py-8">Video not found</div>
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{video.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video mb-4">
            <video
              src={video.video_url}
              controls
              className="w-full h-full rounded-lg"
            />
          </div>
          <p className="text-muted-foreground mb-4">{video.description}</p>
          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {reviewSummary && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Review Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{reviewSummary}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Input
                id="rating"
                type="number"
                min="1"
                max="5"
                {...register('rating', { valueAsNumber: true })}
              />
              {errors.rating && (
                <p className="text-sm text-red-500">{errors.rating.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                {...register('comment')}
                placeholder="Share your thoughts about this video"
              />
              {errors.comment && (
                <p className="text-sm text-red-500">{errors.comment.message}</p>
              )}
            </div>

            <Button type="submit">Submit Review</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Reviews</h2>
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${
                        i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p>{review.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 