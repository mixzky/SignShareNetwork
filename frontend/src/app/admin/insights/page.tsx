"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminInsights() {
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [dailyUploads, setDailyUploads] = useState<{ date: string; count: number }[]>([]);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [approvalRate, setApprovalRate] = useState<{ verified: number; total: number }>({ verified: 0, total: 0 });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 1. Check admin access
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error || !userData || userData.role !== "admin") {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // 2. Fetch daily uploads (last 7 days)
      const today = new Date();
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d;
      });
      const dateStrings = last7.map(d => d.toISOString().slice(0, 10));
      const { data: uploadsData, error: uploadsError } = await supabase
        .from("signvideo")
        .select("created_at")
        .gte("created_at", dateStrings[0] + "T00:00:00.000Z");
      if (uploadsError) {
        setLoading(false);
        return;
      }
      const uploadsByDay: { [date: string]: number } = {};
      for (const d of dateStrings) uploadsByDay[d] = 0;
      uploadsData?.forEach((row: { created_at: string }) => {
        const date = row.created_at.slice(0, 10);
        if (uploadsByDay[date] !== undefined) uploadsByDay[date]++;
      });
      setDailyUploads(dateStrings.map(date => ({ date, count: uploadsByDay[date] })));

      // 3. Fetch active users (uploaded or logged in last 7 days)
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id,last_login");
      if (usersError) {
        setLoading(false);
        return;
      }
      // Get unique user IDs from uploads
      const uploaders = new Set(
        (uploadsData || []).map((row: any) => row.uploader_id)
      );
      // Get users who logged in last 7 days
      const activeLoginUsers = (usersData || []).filter((u: any) => {
        if (!u.last_login) return false;
        const loginDate = new Date(u.last_login);
        return loginDate >= new Date(dateStrings[0] + "T00:00:00.000Z");
      });
      // Union of uploaders and activeLoginUsers
      const uniqueActive = new Set([
        ...uploaders,
        ...activeLoginUsers.map((u: any) => u.id)
      ]);
      setActiveUsers(uniqueActive.size);

      // 4. Approval rate
      const { data: statusData, error: statusError } = await supabase
        .from("signvideo")
        .select("status");
      if (statusError) {
        setLoading(false);
        return;
      }
      const verified = (statusData || []).filter((v: any) => v.status === "verified").length;
      const total = (statusData || []).length;
      setApprovalRate({ verified, total });

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (accessDenied) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-lg text-red-500 font-semibold">Access Denied</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-4">Admin Insights</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Uploads Card */}
        <Card>
          <CardHeader>
            <CardTitle>📅 Daily Uploads (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyUploads.every(d => d.count === 0) ? (
              <div className="text-gray-400 text-center py-8">No uploads in the last 7 days</div>
            ) : (
              <Bar
                data={{
                  labels: dailyUploads.map(d => d.date.slice(5)),
                  datasets: [
                    {
                      label: "Uploads",
                      data: dailyUploads.map(d => d.count),
                      backgroundColor: "#3b82f6"
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                  }
                }}
                height={180}
              />
            )}
          </CardContent>
        </Card>
        {/* Active Users Card */}
        <Card>
          <CardHeader>
            <CardTitle>🧍 Active Users (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-40">
              <span className="text-5xl font-bold text-blue-600">{activeUsers}</span>
              <span className="text-gray-500 mt-2">unique users</span>
            </div>
          </CardContent>
        </Card>
        {/* Approval Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {approvalRate.total === 0 ? (
              <div className="text-gray-400 text-center py-8">No submissions yet</div>
            ) : (
              <Pie
                data={{
                  labels: ["Verified", "Other"],
                  datasets: [
                    {
                      data: [approvalRate.verified, approvalRate.total - approvalRate.verified],
                      backgroundColor: ["#22c55e", "#f87171"]
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "bottom" },
                    title: { display: false }
                  }
                }}
                height={180}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 