"use client";

import { useState, useEffect } from "react";
import {
  getReviewsByVideoId,
  getSupabaseClient,
  getCurrentUser,
  getUserProfile,
} from "@/lib/supabase";

type UserProfile = {
  avatar_url: string | null;
  display_name: string | null;
};

type ReviewType = {
  id?: string;
  user_id?: string;
  rating: number; // 1 for upvote, -1 for downvote
  comment: string;
  user: UserProfile;
};

export default function Review({ videoId }: { videoId: string }) {
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<1 | -1 | 0>(0); // 1: upvote, -1: downvote, 0: none
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session/profile logic (like CountryContent)
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReviewId, setUserReviewId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current user and profile
    const fetchSession = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setSession({ user: { id: user.id } });
          const profile = await getUserProfile(user.id);
          setUserProfile({
            avatar_url: profile?.avatar_url ?? null,
            display_name: profile?.display_name ?? null,
          });
        } else {
          setSession(null);
          setUserProfile(null);
        }
      } catch {
        setSession(null);
        setUserProfile(null);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    // Fetch reviews
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const data = await getReviewsByVideoId(videoId);
        setReviews(
          data.map((review: any) => ({
            id: review.id,
            user_id: review.user_id,
            rating: review.rating,
            comment: review.comment,
            user: Array.isArray(review.user) ? review.user[0] : review.user,
          }))
        );
        // Find current user's review
        if (session?.user?.id) {
          const found = data.find(
            (review: any) => review.user_id === session.user.id
          );
          if (found) {
            setUserReviewId(found.id);
            setRating(found.rating);
            setComment(found.comment);
          } else {
            setUserReviewId(null);
            setRating(0);
            setComment("");
          }
        }
      } catch (err) {
        setError("Failed to load reviews.");
      }
      setLoading(false);
    };

    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, session?.user?.id]);

  // Calculate upvotes and downvotes
  const upvotes = reviews.filter((r) => r.rating === 1).length;
  const downvotes = reviews.filter((r) => r.rating === -1).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!session?.user?.id) {
        setError("You must be logged in to submit a review.");
        setSubmitting(false);
        return;
      }
      if (rating === 0) {
        setError("Please select upvote or downvote.");
        setSubmitting(false);
        return;
      }
      if (userReviewId) {
        // Update existing review
        const { error } = await supabase
          .from("reviews")
          .update({ rating, comment })
          .eq("id", userReviewId);
        if (error) throw error;
      } else {
        // Insert new review
        const { error } = await supabase.from("reviews").insert([
          {
            video_id: videoId,
            user_id: session.user.id,
            rating,
            comment,
          },
        ]);
        if (error) throw error;
      }
      // Refresh reviews
      const data = await getReviewsByVideoId(videoId);
      setReviews(
        data.map((review: any) => ({
          id: review.id,
          user_id: review.user_id,
          rating: review.rating,
          comment: review.comment,
          user: Array.isArray(review.user) ? review.user[0] : review.user,
        }))
      );
      // Update userReviewId and form fields
      const found = data.find(
        (review: any) => review.user_id === session.user.id
      );
      if (found) {
        setUserReviewId(found.id);
        setRating(found.rating);
        setComment(found.comment);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit review.");
    }
    setSubmitting(false);
  };

  return (
    <div>
      {/* Write Review Section */}
      {session && userProfile && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <span className="font-medium text-gray-700">Your Vote:</span>
            <button
              type="button"
              className={`text-2xl px-2 rounded-full border ${
                rating === 1
                  ? "bg-green-100 text-green-600 border-green-400"
                  : "text-gray-400 border-gray-200"
              }`}
              onClick={() => setRating(rating === 1 ? 0 : 1)}
              aria-label="Upvote"
            >
              ▲
            </button>
            <button
              type="button"
              className={`text-2xl px-2 rounded-full border ${
                rating === -1
                  ? "bg-red-100 text-red-600 border-red-400"
                  : "text-gray-400 border-gray-200"
              }`}
              onClick={() => setRating(rating === -1 ? 0 : -1)}
              aria-label="Downvote"
            >
              ▼
            </button>
          </div>
          <textarea
            className="w-full border rounded p-2 mb-2"
            rows={2}
            placeholder="Write your review..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
          {userReviewId && (
            <div className="text-blue-600 text-sm mb-2">
              Editing your review
            </div>
          )}
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={submitting || rating === 0 || !comment.trim()}
          >
            {userReviewId
              ? submitting
                ? "Updating..."
                : "Update Review"
              : submitting
              ? "Submitting..."
              : "Submit Review"}
          </button>
        </form>
      )}

      {/* Upvote/Downvote Count */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-semibold">▲ {upvotes}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-semibold">▼ {downvotes}</span>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center text-gray-500">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center text-gray-500">No reviews yet.</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div key={index} className="p-4 border rounded-lg shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                {review.user?.avatar_url && (
                  <img
                    src={review.user.avatar_url}
                    alt={review.user.display_name || "User"}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <span className="font-semibold">
                  {review.user?.display_name || "Unknown"}
                </span>
                {review.rating === 1 && (
                  <span className="ml-2 text-green-600">▲ Upvote</span>
                )}
                {review.rating === -1 && (
                  <span className="ml-2 text-red-600">▼ Downvote</span>
                )}
              </div>
              <p>{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
