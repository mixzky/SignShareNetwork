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
        .from("sign_videos")
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

      // 3. Fetch active users (uploaded in last 7 days)
      const uploaders = new Set(
        (uploadsData || []).map((row: any) => row.user_id)
      );
      setActiveUsers(uploaders.size);

      // 4. Approval rate
      const { data: statusData, error: statusError } = await supabase
        .from("sign_videos")
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
    <div className="min-h-[80vh] w-full bg-gradient-to-br from-blue-50 via-white to-indigo-100 rounded-xl shadow-inner p-4 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600 text-white rounded-full p-3 shadow-lg">
          <svg xmlns='http://www.w3.org/2000/svg' className='h-7 w-7' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m4 4h1a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v7a2 2 0 002 2h1m4 0v2m0 0h-4m4 0h4' /></svg>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">Admin Insights</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Daily Uploads Card - larger, spans 2 columns on desktop */}
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-xl hover:scale-[1.02] transition-transform duration-200 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-blue-700 flex items-center gap-2">Daily Uploads (7d)</CardTitle>
          </CardHeader>
          <CardContent className="h-96 flex items-center justify-center">
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
                      backgroundColor: "#3b82f6",
                      borderRadius: 6,
                      barPercentage: 0.7
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
                height={320}
                width={700}
              />
            )}
          </CardContent>
        </Card>
        {/* Active Users Card */}
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-xl hover:scale-[1.02] transition-transform duration-200 flex flex-col justify-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-indigo-700 flex items-center gap-2">Active Users (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-40">
              <span className="text-6xl font-extrabold text-indigo-600 drop-shadow">{activeUsers}</span>
              <span className="text-gray-500 mt-2">unique users</span>
            </div>
          </CardContent>
        </Card>
        {/* Approval Rate Card - larger */}
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-xl hover:scale-[1.02] transition-transform duration-200 md:row-span-2 flex flex-col justify-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-green-700 flex items-center gap-2">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent className="h-96 flex items-center justify-center">
            {approvalRate.total === 0 ? (
              <div className="text-gray-400 text-center py-8">No submissions yet</div>
            ) : (
              <Pie
                data={{
                  labels: ["Verified", "Other"],
                  datasets: [
                    {
                      data: [approvalRate.verified, approvalRate.total - approvalRate.verified],
                      backgroundColor: ["#22c55e", "#f87171"],
                      borderWidth: 2,
                      borderColor: ["#16a34a", "#dc2626"]
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
                height={320}
                width={320}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 