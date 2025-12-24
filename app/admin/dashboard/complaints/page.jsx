"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/ui/AdminPageHeader";

export default function AdminComplaintsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/complaints");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "تعذر جلب الشكاوى");
        // Expecting json.data to be an array; fallback to []
        setItems(json.data || []);
      } catch (err) {
        setError(err.message || "خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="الشكاوى" description="عرض وإدارة الشكاوى الواردة" />
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-right px-4 py-3">#</th>
                <th className="text-right px-4 py-3">مقدم الشكوى</th>
                <th className="text-right px-4 py-3">العنوان</th>
                <th className="text-right px-4 py-3">الحالة</th>
                <th className="text-right px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="px-4 py-6 text-center" colSpan={5}>جاري التحميل...</td></tr>
              )}
              {error && !loading && (
                <tr><td className="px-4 py-6 text-center text-red-500" colSpan={5}>{error}</td></tr>
              )}
              {!loading && !error && items.length === 0 && (
                <tr><td className="px-4 py-6 text-center" colSpan={5}>لا توجد بيانات</td></tr>
              )}
              {!loading && !error && items.map((c, idx) => (
                <tr key={c.id || idx} className="border-t">
                  <td className="px-4 py-3">{c.id || idx + 1}</td>
                  <td className="px-4 py-3">{c.name || c.user_email || "—"}</td>
                  <td className="px-4 py-3">{c.subject || "—"}</td>
                  <td className="px-4 py-3">{c.status || "جديدة"}</td>
                  <td className="px-4 py-3">
                    <a href="/admin/dashboard/resolve-complaint" className="text-primary hover:underline">حل</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
