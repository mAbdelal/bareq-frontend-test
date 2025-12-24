"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { useUser } from "@/context/UserContext";
import Loader from "@/components/ui/Loader";
import fetchWithAuth from "@/lib/api";

export default function AdminDashboardHome() {
  const [stats, setStats] = useState({ disputesCount: 0, newComplaints: 0, transactionsToday: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { state } = useUser();
  const router = useRouter();
  // const [authChecking, setAuthChecking] = useState(true);

  // useEffect(() => {
  //   if (state.user === undefined) return; // still loading

  //   if (state.user === null) {
  //     // User is not logged in, redirect to admin login
  //     router.replace("/admin/login");
  //   } else if (!state.user.role) {
  //     // User is logged in but not an admin, redirect to home
  //     router.replace("/home");
  //   } else {
  //     // User is an admin, allow access
  //     setAuthChecking(false);
  //   }
  // }, [state.user, router]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/admins/stats`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'تعذر جلب الإحصائيات');
        setStats(json.data || {});
      } catch (e) {
        setError(e.message || 'حدث خطأ');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { t: 'عدد النزاعات', v: stats.disputesCount },
    { t: 'الشكاوى الجديدة', v: stats.newComplaints },
    { t: 'التحويلات اليوم', v: stats.transactionsToday },
    { t: 'المستخدمون النشطون', v: stats.activeUsers },
  ];

  // if (authChecking) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <Loader />
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="الرئيسية" description="نظرة عامة سريعة على مؤشرات لوحة التحكم" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && cards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4">
            <div className="text-label text-sm">{c.t}</div>
            <div className="text-2xl font-bold mt-2">--</div>
          </div>
        ))}
        {!loading && !error && cards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4">
            <div className="text-label text-sm">{c.t}</div>
            <div className="text-2xl font-bold mt-2">{c.v}</div>
          </div>
        ))}
        {error && !loading && (
          <div className="col-span-4 bg-white rounded-xl shadow p-4 text-red-500">{error}</div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="font-bold mb-2">آخر الأنشطة</div>
        <p className="text-label">لا توجد بيانات لعرضها حاليًا.</p>
      </div>
    </div>
  );
}
