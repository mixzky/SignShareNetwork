"use client";

export const dynamic = "force-dynamic";

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
  ArcElement,
} from "chart.js";
import BarChartIcon from "@mui/icons-material/BarChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupIcon from "@mui/icons-material/Group";

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
  const [dailyUploads, setDailyUploads] = useState<
    { date: string; count: number }[]
  >([]);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [approvalRate, setApprovalRate] = useState<{
    verified: number;
    total: number;
  }>({ verified: 0, total: 0 });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 1. Check admin access
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const dateStrings = last7.map((d) => d.toISOString().slice(0, 10));
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
      setDailyUploads(
        dateStrings.map((date) => ({ date, count: uploadsByDay[date] }))
      );

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
      const verified = (statusData || []).filter(
        (v: any) => v.status === "verified"
      ).length;
      const total = (statusData || []).length;
      setApprovalRate({ verified, total });

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading insights...</p>
        </div>
      </div>
    );
  }
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center rounded-xl">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-red-200">
          <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-700 mb-2">Access Denied</h3>
          <p className="text-red-600">
            You don't have permission to view this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 rounded-xl">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 leading-tight">
              Admin Insights
            </h1>
          </div>
          <p className="text-slate-600 text-lg ml-16">
            Platform analytics and performance metrics
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Videos */}
          <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">
                    Total Videos
                  </p>
                  <p className="text-3xl font-bold text-slate-800">
                    {approvalRate.total}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">
                    Active Users (7d)
                  </p>
                  <p className="text-3xl font-bold text-slate-800">
                    {activeUsers}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Rate */}
          <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">
                    Approval Rate
                  </p>
                  <p className="text-3xl font-bold text-slate-800">
                    {approvalRate.total > 0
                      ? Math.round(
                          (approvalRate.verified / approvalRate.total) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Daily Uploads Chart */}
          <Card className="xl:col-span-2 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-slate-800">
                  Daily Uploads (Last 7 Days)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {dailyUploads.every((d) => d.count === 0) ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                  <div className="p-3 bg-slate-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-600 mb-1">
                    No Recent Uploads
                  </h3>
                  <p className="text-slate-500">
                    No videos uploaded in the last 7 days
                  </p>
                </div>
              ) : (
                <div className="h-80">
                  <Bar
                    data={{
                      labels: dailyUploads.map((d) => {
                        const date = new Date(d.date);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }),
                      datasets: [
                        {
                          label: "Videos Uploaded",
                          data: dailyUploads.map((d) => d.count),
                          backgroundColor: "rgb(59, 130, 246, 0.8)",
                          borderColor: "rgb(59, 130, 246)",
                          borderWidth: 2,
                          borderRadius: 8,
                          borderSkipped: false,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          titleColor: "white",
                          bodyColor: "white",
                          borderColor: "rgb(59, 130, 246)",
                          borderWidth: 1,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                            color: "rgb(100, 116, 139)",
                            font: { size: 12 },
                          },
                          grid: { color: "rgb(226, 232, 240)" },
                          border: { display: false },
                        },
                        x: {
                          ticks: {
                            color: "rgb(100, 116, 139)",
                            font: { size: 12 },
                          },
                          grid: { display: false },
                          border: { display: false },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Rate Pie Chart */}
          <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-slate-800">
                  Video Status
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {approvalRate.total === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                  <div className="p-3 bg-slate-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-600 mb-1">
                    No Data
                  </h3>
                  <p className="text-slate-500">No video submissions yet</p>
                </div>
              ) : (
                <div className="h-80 flex flex-col">
                  <div className="flex-1">
                    <Pie
                      data={{
                        labels: ["Verified", "Other Status"],
                        datasets: [
                          {
                            data: [
                              approvalRate.verified,
                              approvalRate.total - approvalRate.verified,
                            ],
                            backgroundColor: [
                              "rgb(34, 197, 94)",
                              "rgb(239, 68, 68)",
                            ],
                            borderWidth: 0,
                            hoverOffset: 4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: {
                              padding: 20,
                              font: { size: 13 },
                              color: "rgb(100, 116, 139)",
                            },
                          },
                          tooltip: {
                            backgroundColor: "rgba(15, 23, 42, 0.9)",
                            titleColor: "white",
                            bodyColor: "white",
                            borderColor: "rgb(59, 130, 246)",
                            borderWidth: 1,
                          },
                        },
                      }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-2xl font-bold text-emerald-600">
                        {approvalRate.verified}
                      </p>
                      <p className="text-sm text-emerald-700 font-medium">
                        Verified
                      </p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-2xl font-bold text-red-600">
                        {approvalRate.total - approvalRate.verified}
                      </p>
                      <p className="text-sm text-red-700 font-medium">Other</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
