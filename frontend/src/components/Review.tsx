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
import { toast } from "sonner";

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
        toast.success("Review updated successfully!");

        // Announce success to screen readers
        const announcement = document.createElement("div");
        announcement.setAttribute("role", "status");
        announcement.setAttribute("aria-live", "assertive");
        announcement.className = "sr-only";
        announcement.textContent = "Your review has been updated successfully.";
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 3000);

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
        toast.success("Review submitted successfully!");

        // Announce success to screen readers
        const announcement = document.createElement("div");
        announcement.setAttribute("role", "status");
        announcement.setAttribute("aria-live", "assertive");
        announcement.className = "sr-only";
        announcement.textContent = `Your review has been submitted successfully. You ${
          rating === 1 ? "upvoted" : "downvoted"
        } this video.`;
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 3000);
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

      // Announce error to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "assertive");
      announcement.className = "sr-only";
      announcement.textContent = `Error submitting review: ${
        err.message || "Failed to submit review."
      }`;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 5000);
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
      toast.success("Review deleted successfully!");
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
    <section
      className="w-full"
      role="region"
      aria-label="Video reviews and ratings"
    >
      {/* Vote counts and comment count display */}
      <div
        className="flex items-center gap-6 mt-4 ml-4 mb-4 justify-start"
        role="group"
        aria-label="Video rating summary"
      >
        <button
          type="button"
          aria-label={`Upvote this video. Currently ${upvotes} upvotes. ${
            rating === 1 ? "You have upvoted this video." : "Click to upvote."
          }`}
          className={`flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-md px-2 py-1 transition 
      ${
        rating === 1
          ? "text-green-500"
          : "text-gray-600 hover:text-green-500 cursor-pointer transition duration-200"
      }`}
          onClick={() => {
            const newRating = rating === 1 ? 0 : 1;
            setRating(newRating);
            // Announce state change to screen readers
            const announcement = document.createElement("div");
            announcement.setAttribute("role", "status");
            announcement.setAttribute("aria-live", "polite");
            announcement.className = "sr-only";
            announcement.textContent =
              newRating === 1 ? "Video upvoted" : "Upvote removed";
            document.body.appendChild(announcement);
            setTimeout(() => document.body.removeChild(announcement), 3000);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setRating(rating === 1 ? 0 : 1);
            }
          }}
          tabIndex={0}
        >
          <ArrowUpwardIcon
            className="mr-1 border-2 rounded-full bg-green-300 border-green-300"
            fontSize="medium"
            aria-hidden="true"
          />
          <span className="font-bold text-base">{upvotes}</span>
        </button>
        <button
          type="button"
          aria-label={`Downvote this video. Currently ${downvotes} downvotes. ${
            rating === -1
              ? "You have downvoted this video."
              : "Click to downvote."
          }`}
          className={`flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-2 py-1 transition 
      ${
        rating === -1
          ? "text-red-500"
          : "text-gray-600 hover:text-red-500 cursor-pointer"
      }`}
          onClick={() => {
            const newRating = rating === -1 ? 0 : -1;
            setRating(newRating);
            // Announce state change to screen readers
            const announcement = document.createElement("div");
            announcement.setAttribute("role", "status");
            announcement.setAttribute("aria-live", "polite");
            announcement.className = "sr-only";
            announcement.textContent =
              newRating === -1 ? "Video downvoted" : "Downvote removed";
            document.body.appendChild(announcement);
            setTimeout(() => document.body.removeChild(announcement), 3000);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setRating(rating === -1 ? 0 : -1);
            }
          }}
          tabIndex={0}
        >
          <ArrowDownwardIcon
            className="mr-1 border-2 rounded-full bg-red-300 border-red-300"
            fontSize="medium"
            aria-hidden="true"
          />
          <span className="font-bold text-base">{downvotes}</span>
        </button>
        <div
          className="flex items-center gap-1 text-gray-600"
          role="status"
          aria-label={`${reviews.length} total reviews`}
        >
          <MessageOutlinedIcon aria-hidden="true" />
          <span className="text-sm font-medium">{reviews.length}</span>
          <span className="sr-only">reviews</span>
        </div>
      </div>

      <hr
        className="border-zinc-200 dark:border-zinc-700 w-31/32 mx-auto"
        role="separator"
        aria-hidden="true"
      />
      {session && userProfile && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4"
          aria-label="Write a review for this video"
        >
          <div className="flex items-center gap-3 mb-3">
            {userProfile.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={`${userProfile.display_name || "Your"} profile picture`}
                className="w-8 h-8 rounded-full border border-zinc-300"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-400"
                role="img"
                aria-label="Default profile picture"
              >
                <span className="text-lg" aria-hidden="true">
                  👤
                </span>
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
                  role="status"
                  aria-live="polite"
                >
                  <svg
                    className="w-3 h-3 mr-1 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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
          </div>
          <div className="space-y-2">
            <label htmlFor={`review-comment-${videoId}`} className="sr-only">
              {userReviewId
                ? "Edit your review comment"
                : "Write your review comment"}
            </label>
            <textarea
              id={`review-comment-${videoId}`}
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 mb-2 bg-zinc-50 dark:bg-zinc-800 text-[#333d42] text-sm dark:text-zinc-100 focus:ring-2 focus:ring-blue-400 focus:outline-none transition resize-none"
              rows={2}
              placeholder={
                userReviewId ? "Edit your review..." : "Share your thoughts..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={handleKeyDown}
              required
              aria-describedby={`review-help-${videoId}`}
              aria-invalid={error ? "true" : "false"}
            />
            <p id={`review-help-${videoId}`} className="text-xs text-gray-500">
              {userReviewId
                ? "Press Enter to update your review, or Shift+Enter for a new line."
                : "First select upvote or downvote above, then write your comment. Press Enter to submit, or Shift+Enter for a new line."}
            </p>
          </div>
          {userReviewId && (
            <div
              className="flex items-center gap-3 mb-2"
              role="group"
              aria-label="Review editing options"
            >
              <span
                className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold"
                role="status"
              >
                <svg
                  className="w-3 h-3 mr-1 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
                aria-label="Delete your review permanently"
                className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100 focus:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 text-xs cursor-pointer font-medium transition"
                onClick={async () => {
                  await handleDelete();
                  // Announce deletion to screen readers
                  const announcement = document.createElement("div");
                  announcement.setAttribute("role", "status");
                  announcement.setAttribute("aria-live", "assertive");
                  announcement.className = "sr-only";
                  announcement.textContent = "Your review has been deleted.";
                  document.body.appendChild(announcement);
                  setTimeout(
                    () => document.body.removeChild(announcement),
                    3000
                  );
                }}
                disabled={submitting}
              >
                <svg
                  className="w-3 h-3 mr-1 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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

          {error && (
            <div
              className="text-red-500 text-sm mb-2"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {/* Hidden submit button for Enter key functionality */}
          <button
            type="submit"
            className="sr-only"
            disabled={submitting || rating === 0 || !comment.trim()}
            aria-label={
              userReviewId ? "Update your review" : "Submit your review"
            }
          >
            {userReviewId ? "Update Review" : "Submit Review"}
          </button>

          {/* Live region for form submission status */}
          <div role="status" aria-live="polite" className="sr-only">
            {submitting &&
              (userReviewId
                ? "Updating your review..."
                : "Submitting your review...")}
          </div>
        </form>
      )}

      {/* Message for non-authenticated users */}
      {!session && (
        <div
          className="bg-gray-50 p-4 text-center border-l-4 border-blue-500"
          role="region"
          aria-label="Authentication required"
        >
          <p className="text-gray-700 mb-2">
            <strong>Sign in to rate and review this video</strong>
          </p>
          <p className="text-sm text-gray-600">
            Join the community to share your thoughts and help others discover
            great sign language content.
          </p>
        </div>
      )}

      <hr
        className="border-zinc-200 dark:border-zinc-700 w-31/32 mx-auto"
        role="separator"
        aria-hidden="true"
      />
      {/* Reviews List (comments) */}
      <div role="region" aria-label="User reviews">
        {loading ? (
          <div
            className="text-center text-[#555555] mt-2 mb-2"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Loading reviews...</span>
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div
            className="text-center text-[#555555] mb-6 mt-6 px-4 py-3 font-medium"
            role="status"
            aria-live="polite"
          >
            No reviews yet — be the first to add one!
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="sr-only">
              {reviews.length} review{reviews.length !== 1 ? "s" : ""} for this
              video
            </h3>
            {reviews.slice(0, visibleCount).map((review, index) => (
              <article
                key={review.id || index}
                className="bg-white"
                role="article"
                aria-labelledby={`review-author-${index}`}
                aria-describedby={`review-content-${index}`}
              >
                <div className="p-4 flex flex-col gap-1">
                  <header className="flex items-center gap-2">
                    {review.user?.avatar_url ? (
                      <img
                        src={review.user.avatar_url}
                        alt={`${
                          review.user.display_name || "User"
                        }'s profile picture`}
                        className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-700"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-400"
                        role="img"
                        aria-label="Default profile picture"
                      >
                        <span className="text-base" aria-hidden="true">
                          👤
                        </span>
                      </div>
                    )}
                    <span
                      id={`review-author-${index}`}
                      className="font-bold text-black text-sm dark:text-zinc-200"
                    >
                      {review.user?.display_name || "Unknown"}
                    </span>
                    {review.rating === 1 && (
                      <span
                        className="ml-2 text-green-600 font-bold text-xs flex items-center gap-1"
                        role="img"
                        aria-label="Upvoted this video"
                      >
                        <ArrowUpwardIcon
                          fontSize="inherit"
                          aria-hidden="true"
                        />
                      </span>
                    )}
                    {review.rating === -1 && (
                      <span
                        className="ml-2 text-red-600 font-bold text-xs flex items-center gap-1"
                        role="img"
                        aria-label="Downvoted this video"
                      >
                        <ArrowDownwardIcon
                          fontSize="inherit"
                          aria-hidden="true"
                        />
                      </span>
                    )}
                  </header>
                  <p
                    id={`review-content-${index}`}
                    className="text-[#333d42] dark:text-zinc-100 text-sm ml-9 mb-2"
                  >
                    {review.comment}
                  </p>
                </div>
                {/* Divider between comments, except after the last one */}
                {index !== Math.min(visibleCount, reviews.length) - 1 && (
                  <hr
                    className="border-zinc-200 dark:border-zinc-700 w-31/32 mx-auto"
                    role="separator"
                    aria-hidden="true"
                  />
                )}
                {/* Show "Show comments" button after the last visible comment */}
                {index === visibleCount - 1 &&
                  visibleCount < reviews.length && (
                    <div className="flex justify-center mt-2">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-gray-500 hover:text-blue-400 focus:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-3 py-2 transition cursor-pointer mb-2"
                        onClick={() => {
                          setVisibleCount((prev) => prev + 3);
                          // Announce to screen readers
                          const announcement = document.createElement("div");
                          announcement.setAttribute("role", "status");
                          announcement.setAttribute("aria-live", "polite");
                          announcement.className = "sr-only";
                          announcement.textContent = `Showing ${Math.min(
                            visibleCount + 3,
                            reviews.length
                          )} of ${reviews.length} reviews`;
                          document.body.appendChild(announcement);
                          setTimeout(
                            () => document.body.removeChild(announcement),
                            3000
                          );
                        }}
                        aria-label={`Show ${Math.min(
                          3,
                          reviews.length - visibleCount
                        )} more reviews. Currently showing ${visibleCount} of ${
                          reviews.length
                        } reviews.`}
                      >
                        <MessageOutlinedIcon aria-hidden="true" />
                        <span className="text-sm font-medium">
                          Show more comments ({reviews.length - visibleCount}{" "}
                          remaining)
                        </span>
                      </button>
                    </div>
                  )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
