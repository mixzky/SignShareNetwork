"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser } from "@/lib/supabase";

type Activity = {
  id: number;
  created_at: string;
  type: string;
  user_id: string;
  video_id: string;
  message: string;
  video_title?: string;
};

export default function UserFeed() {
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserAndActivities() {
      const user = await getCurrentUser();
      setUser(user);
      if (user) {
        const { data: activitiesData, error } = await supabase
          .from("activities")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && activitiesData && activitiesData.length > 0) {
          // Get unique video_ids except for deleted activities
          const videoIds = [
            ...new Set(
              activitiesData
                .filter((a: Activity) => a.type !== "deleted" && a.video_id)
                .map((a: Activity) => a.video_id)
            ),
          ];

          // Fetch video titles for all video_ids
          let videoTitles: Record<string, string> = {};
          if (videoIds.length > 0) {
            const { data: videos } = await supabase
              .from("sign_videos")
              .select("id, title")
              .in("id", videoIds);

            if (videos) {
              videoTitles = videos.reduce(
                (
                  acc: Record<string, string>,
                  v: { id: string; title: string }
                ) => {
                  acc[v.id] = v.title;
                  return acc;
                },
                {}
              );
            }
          }

          // Attach video_title to each activity (except deleted)
          const activitiesWithTitles = activitiesData.map((a: Activity) => ({
            ...a,
            video_title:
              a.type !== "deleted" && a.video_id
                ? videoTitles[a.video_id]
                : undefined,
          }));

          setActivities(activitiesWithTitles);
        } else {
          setActivities([]);
        }
      }
      setLoading(false);
    }

    fetchUserAndActivities();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center w-full max-w-sm">
        <span className="text-gray-400 text-lg font-medium">
          Loading activity feed...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center w-full max-w-sm">
        <span className="text-gray-400 text-lg font-medium">
          Please log in to see your activity feed.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center w-full max-w-1/2 min-h-[416px] max-h-[416px] border border-[#e0e3ea]">
      <h2 className="text-2xl font-extrabold mb-6 text-[#2d2d2d] tracking-tight">
        Activity Feed
      </h2>
      <div
        className="w-full flex flex-col gap-4 bg-[#f8fafc] rounded-lg p-2 overflow-y-auto border  border-[#e0e3ea]"
        style={{ minHeight: "280px", maxHeight: "300px" }}
      >
        {activities.length === 0 && (
          <div className="text-gray-400 text-center">No recent activities.</div>
        )}
        {activities.map((activity) => {
          let bgColor = "bg-white";
          if (activity.type === "review") bgColor = "bg-[#e3edfa]";
          if (activity.type === "verified") bgColor = "bg-[#e6f9f2]";
          if (activity.type === "flagged") bgColor = "bg-[#fff8e1]";
          if (activity.type === "rejected") bgColor = "bg-[#ffeaea]";
          if (activity.type === "deleted") bgColor = "bg-[#f5f5f5]";
          if (activity.type === "updated") bgColor = "bg-[#ede7fa]";

          return (
            <div
              key={activity.id}
              className={`flex items-center gap-3 ${bgColor} border border-[#e0e3ea] rounded-lg px-4 py-3 shadow-sm`}
            >
              {/* Icon based on activity type */}
              <span>
                {activity.type === "review" && (
                  // Chat bubble icon for review
                  <svg
                    className="w-5 h-5 text-[#2563eb]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4-4.03 7-9 7a9.77 9.77 0 01-4-.8L3 21l1.8-4A7.94 7.94 0 013 12c0-4 4.03-7 9-7s9 3 9 7z"
                    />
                  </svg>
                )}
                {activity.type === "verified" && (
                  <svg
                    className="w-5 h-5 text-[#00b894]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {activity.type === "flagged" && (
                  <svg
                    className="w-5 h-5 text-[#ffb300]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414 1.414M12 8v4m0 4h.01"
                    />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
                {activity.type === "rejected" && (
                  <svg
                    className="w-5 h-5 text-[#ff6b6b]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                {activity.type === "deleted" && (
                  <svg
                    className="w-5 h-5 text-[#bdbdbd]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 6h18M9 6v12a2 2 0 002 2h2a2 2 0 002-2V6"
                    />
                  </svg>
                )}
                {activity.type === "updated" && (
                  // Pencil/edit icon for updated
                  <svg
                    className="w-5 h-5 text-[#6c63ff]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z"
                    />
                  </svg>
                )}
              </span>
              <span className="flex-1 text-sm text-[#2d2d2d]">
                {activity.message}
                {/* Show video title if available and not deleted */}
                {activity.video_title && (
                  <span className="ml-1 text-[#2563eb] font-semibold">
                    ({activity.video_title})
                  </span>
                )}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(activity.created_at).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
