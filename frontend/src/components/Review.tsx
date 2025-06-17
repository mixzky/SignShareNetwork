"use client";

import { useState, useEffect } from "react";
import {
  getReviewsByVideoId,
  getSupabaseClient,
  getCurrentUser,
  getUserProfile,
} from "@/lib/supabase";
import { IconButton, Tooltip } from "@mui/material";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";

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
  const [rating, setRating] = useState<1 | -1 | 0>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReviewId, setUserReviewId] = useState<string | null>(null);

  useEffect(() => {
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

  const upvotes = reviews.filter((r) => r.rating === 1).length;
  const downvotes = reviews.filter((r) => r.rating === -1).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

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
        const { error } = await supabase
          .from("reviews")
          .update({ rating, comment })
          .eq("id", userReviewId);
        if (error) throw error;
        setSuccess("Review updated successfully.");
      } else {
        const { error } = await supabase.from("reviews").insert([
          {
            video_id: videoId,
            user_id: session.user.id,
            rating,
            comment,
          },
        ]);
        if (error) throw error;
        setSuccess("Review submitted successfully.");
      }
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

  const handleDelete = async () => {
    if (!userReviewId) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", userReviewId);
      if (error) throw error;
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
      setUserReviewId(null);
      setRating(0);
      setComment("");
      setSuccess("Review deleted.");
    } catch (err: any) {
      setError(err.message || "Failed to delete review.");
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full">
      {/* Upvote/Downvote Count */}
      <div className="flex gap-6 mb-4 justify-end pr-4 pt-4">
        <div className="flex items-center gap-1 ">
          <ThumbUpAltIcon className="text-green-500" fontSize="small" />
          <span className="font-bold text-base text-green-500">{upvotes}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbDownAltIcon className="text-red-500" fontSize="small" />
          <span className="font-bold text-base text-red-500">{downvotes}</span>
        </div>
      </div>

      <hr className="border-[#dedede] mb-6" />

      {/* Write Review Section */}
      {session && userProfile && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 r">
          <div className="flex items-center gap-3 mb-3">
            {userProfile.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.display_name || "User"}
                className="w-8 h-8 rounded-full border border-zinc-300"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-400">
                <span className="text-lg">👤</span>
              </div>
            )}
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">
              {userProfile.display_name || "You"}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <Tooltip title="Upvote">
                <IconButton
                  color={rating === 1 ? "success" : "default"}
                  onClick={() => setRating(rating === 1 ? 0 : 1)}
                  size="small"
                >
                  {rating === 1 ? <ThumbUpAltIcon /> : <ThumbUpOffAltIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Downvote">
                <IconButton
                  color={rating === -1 ? "error" : "default"}
                  onClick={() => setRating(rating === -1 ? 0 : -1)}
                  size="small"
                >
                  {rating === -1 ? (
                    <ThumbDownAltIcon />
                  ) : (
                    <ThumbDownOffAltIcon />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          </div>
          <textarea
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 mb-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-400 transition"
            rows={2}
            placeholder="Share your thoughts..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
          {userReviewId && (
            <div className="flex items-center gap-2 mb-2">
              <div className="text-blue-600 text-xs font-medium">
                Editing your review
              </div>
              <button
                type="button"
                className="text-red-600 text-xs underline"
                onClick={handleDelete}
                disabled={submitting}
              >
                Delete Review
              </button>
            </div>
          )}

          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 rounded-lg shadow transition disabled:opacity-50"
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
      <hr className="border-[#dedede] mb-4" />

      {/* Reviews List */}
      {loading ? (
        <div className="text-center text-zinc-400">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center text-zinc-400 mb-6">No reviews yet.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review, index) => (
            <div key={index}>
              <div className="p-4 bg-white flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {review.user?.avatar_url ? (
                    <img
                      src={review.user.avatar_url}
                      alt={review.user.display_name || "User"}
                      className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-700"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-400">
                      <span className="text-base">👤</span>
                    </div>
                  )}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    {review.user?.display_name || "Unknown"}
                  </span>
                  {review.rating === 1 && (
                    <span className="ml-2 text-green-600 font-bold text-xs flex items-center gap-1">
                      ▲ Upvote
                    </span>
                  )}
                  {review.rating === -1 && (
                    <span className="ml-2 text-red-600 font-bold text-xs flex items-center gap-1">
                      ▼ Downvote
                    </span>
                  )}
                </div>
                <p className="text-zinc-700 dark:text-zinc-100 text-sm">
                  {review.comment}
                </p>
              </div>
              {/* Divider between comments, except after the last one */}
              {index !== reviews.length - 1 && (
                <hr className="border-[#dedede] my-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
