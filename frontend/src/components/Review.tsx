"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  getReviewsByVideoId,
  getSupabaseClient,
  getCurrentUser,
  getUserProfile,
} from "@/lib/supabase";
import IconButton from "@mui/material/IconButton";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import Tooltip from "@mui/material/Tooltip";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardOutlinedIcon from "@mui/icons-material/ArrowUpwardOutlined";
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

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
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showUpdated, setShowUpdated] = useState(false);

  // Pagination state for comments
  const [visibleCount, setVisibleCount] = useState(3);

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
        setShowUpdated(true);
        setTimeout(() => setShowUpdated(false), 3000);
        setIsEditing(false);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="w-full">
      {/* Write Review Section */}
      {/* Horizontal row: Upvote/Downvote/Comment icon */}
      <div className="flex items-center gap-6 mt-4 ml-4 mb-4 justify-start ">
        <button
          type="button"
          aria-label="upvote"
          className={`flex items-center gap-1  focus:outline-none transition 
      ${
        rating === 1
          ? "text-green-500"
          : "text-gray-600 hover:text-green-500  cursor-pointer transition duration-200"
      }`}
          onClick={() => setRating(rating === 1 ? 0 : 1)}
        >
          <ArrowUpwardIcon
            className="mr-1 border-2 rounded-full bg-green-300 border-green-300 "
            fontSize="medium"
          />
          <span className="font-bold text-base">{upvotes}</span>
        </button>
        <button
          type="button"
          aria-label="downvote"
          className={`flex items-center gap-1 focus:outline-none transition 
      ${
        rating === -1
          ? "text-red-500"
          : "text-gray-600 hover:text-red-500 cursor-pointer"
      }`}
          onClick={() => setRating(rating === -1 ? 0 : -1)}
        >
          <ArrowDownwardIcon
            className="mr-1 border-2 rounded-full bg-red-300 border-red-300"
            fontSize="medium"
          />
          <span className="font-bold text-base">{downvotes}</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 text-gray-600 "
        >
          <MessageOutlinedIcon />
          <span className="text-sm font-medium">{reviews.length}</span>
        </button>
      </div>

      <hr className="border-zinc-200 dark:border-zinc-700 w-31/32 mx-auto " />
      {session && userProfile && (
        <form onSubmit={handleSubmit} className=" bg-white p-4 ">
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
            <span className="font-bold text-black text-sm dark:text-zinc-100">
              {userProfile.display_name || "You"}
            </span>
            {/* Animated Updated Review badge */}
            <AnimatePresence>
              {showUpdated && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold ml-3"
                >
                  <svg
                    className="w-3 h-3 mr-1 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Updated Review
                </motion.span>
              )}
            </AnimatePresence>
            {/* ...your Edit/Editing badges/buttons here... */}
          </div>
          <textarea
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 mb-2 bg-zinc-50 dark:bg-zinc-800 text-[#333d42] text-sm dark:text-zinc-100 focus:ring-2 focus:ring-blue-400 transition resize-none"
            rows={2}
            placeholder="Share your thoughts..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            required
          />
          {userReviewId && (
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                <svg
                  className="w-3 h-3 mr-1 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5h2m-1 0v14m-7-7h14"
                  />
                </svg>
                Editing your review
              </span>
              <button
                type="button"
                aria-label="delete"
                className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100 text-xs cursor-pointer  font-medium transition"
                onClick={handleDelete}
                disabled={submitting}
              >
                <svg
                  className="w-3 h-3 mr-1 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Delete
              </button>
            </div>
          )}

          {error && <div className="text-red-500 text-sm ">{error}</div>}
        </form>
      )}
      <hr className="border-zinc-200 dark:border-zinc-700 w-31/32 mx-auto " />
      {/* Reviews List (comments) */}
      <div>
        {loading ? (
          <div className="text-center text-[#555555] mt-2 mb-2">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center  text-[#555555] mb-6 mt-6 px-4 py-3  font-medium">
            No reviews yet — be the first to add one!
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.slice(0, visibleCount).map((review, index) => (
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
                    <span className="font-bold text-black text-sm dark:text-zinc-200">
                      {review.user?.display_name || "Unknown"}
                    </span>
                    {review.rating === 1 && (
                      <span className="ml-2 text-green-600 font-bold text-xs flex items-center gap-1">
                        <ArrowUpwardIcon fontSize="inherit" />
                      </span>
                    )}
                    {review.rating === -1 && (
                      <span className="ml-2 text-red-600 font-bold text-xs flex items-center gap-1">
                        <ArrowDownwardIcon fontSize="inherit" />
                      </span>
                    )}
                  </div>
                  <p className="text-[#333d42] dark:text-zinc-100 text-sm ml-9 mb-2">
                    {review.comment}
                  </p>
                </div>
                {/* Divider between comments, except after the last one */}
                {index !== reviews.length - 1 && (
                  <hr className="border-zinc-200 dark:border-zinc-700 w-31/32 mx-auto " />
                )}
                {/* Show "Show comments" button after the last visible comment */}
                {index === visibleCount - 1 &&
                  visibleCount < reviews.length && (
                    <div className="flex justify-center mt-2">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-gray-500 hover:text-blue-400 transition focus:outline-none cursor-pointer mb-2 "
                        onClick={() => setVisibleCount((prev) => prev + 3)}
                      >
                        <MessageOutlinedIcon />
                        <span className="text-sm font-medium">
                          Show more comments
                        </span>
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
