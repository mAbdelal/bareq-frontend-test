"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import fetchWithAuth from "@/lib/api";
import AdminPageHeader from "@/components/ui/AdminPageHeader";

export default function AdminTransactionsPage() {
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      user_id: "",
      admin_id: "",
      direction: "",
      reason: "",
      from_date: "",
      to_date: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });

  // 🔹 Fetch transactions from backend
  const fetchTransactions = async (filters = {}, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...filters, page, limit: pagination.limit }).filter(
            ([_, v]) => v
          )
        )
      );

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_BASE_URL}/transactions/search?${params.toString()}`
      );

      const json = await res.json();

      if (res.ok && json.data) {
        setTransactions(json.data.data || []);
        setPagination(json.data.pagination || pagination);
      } else {
        toast.error(json.message || "حدث خطأ أثناء تحميل التحويلات المالية");
      }
    } catch (err) {
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  // 🔸 Load first page on mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // 🔸 Handle filter submit
  const onSubmit = async (data) => {
    setPagination((prev) => ({ ...prev, page: 1 })); // reset to first page
    await fetchTransactions(data, 1);
  };

  // 🔸 Reset filters
  const handleResetFilters = () => {
    reset();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  // 🔸 Change page handler
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const currentFilters = watch();
    setPagination((prev) => ({ ...prev, page: newPage }));
    await fetchTransactions(currentFilters, newPage);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="التحويلات المالية"
        description="سجل جميع التحويلات المالية داخل المنصة"
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-right">
            بحث في التحويلات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right"
          >
            {/* User ID */}
            <div className="space-y-2">
              <Label htmlFor="user_id">معرف المستخدم</Label>
              <Input placeholder="UUID المستخدم" {...register("user_id")} />
            </div>

            {/* Admin ID */}
            <div className="space-y-2">
              <Label htmlFor="admin_id">معرف المشرف</Label>
              <Input placeholder="UUID المشرف" {...register("admin_id")} />
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <Label>نوع العملية</Label>
              <Select
                value={watch("direction")}
                onValueChange={(value) => setValue("direction", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">إيداع</SelectItem>
                  <SelectItem value="debit">سحب</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">السبب</Label>
              <Input placeholder="سبب التحويل" {...register("reason")} />
            </div>

            {/* From Date */}
            <div className="space-y-2">
              <Label htmlFor="from_date">من تاريخ</Label>
              <Input type="date" {...register("from_date")} />
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <Label htmlFor="to_date">إلى تاريخ</Label>
              <Input type="date" {...register("to_date")} />
            </div>

            {/* Buttons */}
            <div className="flex items-end justify-end gap-2 col-span-1 md:col-span-3">
              <Button type="submit" disabled={loading}>
                {loading ? "جاري البحث..." : "بحث"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                disabled={loading}
              >
                إزالة الفلاتر
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-right">
            {loading
              ? "جاري التحميل..."
              : `النتائج (${pagination.total})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 && !loading ? (
            <p className="text-center text-muted-foreground">
              لا توجد تحويلات مطابقة للبحث
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border text-right text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-2 border">#</th>
                      <th className="p-2 border">اسم المستخدم</th>
                      <th className="p-2 border">اسم المشرف</th>
                      <th className="p-2 border">المبلغ</th>
                      <th className="p-2 border">النوع</th>
                      <th className="p-2 border">السبب</th>
                      <th className="p-2 border">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, index) => (
                      <tr key={t.id} className="border-b hover:bg-gray-50">
                        {/* Row number */}
                        <td className="p-2 border">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>

                        {/* User Info */}
                        <td
                          className="p-2 border cursor-pointer"
                          title={`User ID: ${t.user_id || "N/A"}`} // ✅ Tooltip
                          onClick={() => {
                            navigator.clipboard.writeText(t.user_id || "");
                            toast.success("تم نسخ معرف المستخدم");
                          }}
                        >
                          {t.user_name || "-"}
                          <br />
                          <span className="text-xs text-gray-500">{t.user_email || ""}</span>
                        </td>

                        {/* Admin Info */}
                        <td
                          className="p-2 border cursor-pointer"
                          title={`Admin ID: ${t.admin_id || "N/A"}`} // ✅ Tooltip
                          onClick={() => {
                            navigator.clipboard.writeText(t.admin_id || "");
                            toast.success("تم نسخ معرف المشرف");
                          }}
                        >
                          {t.admin_name || "-"}
                          <br />
                          <span className="text-xs text-gray-500">{t.admin_email || ""}</span>
                        </td>

                        {/* Amount */}
                        <td
                          className={`p-2 border font-semibold ${t.direction === "credit" ? "text-green-600" : "text-red-600"
                            }`}
                        >
                          {t.direction === "credit" ? "+" : "-"} {t.amount.toFixed(2)} $
                        </td>

                        {/* Direction */}
                        <td className="p-2 border">
                          {t.direction === "credit" ? "إيداع" : "سحب"}
                        </td>

                        {/* Reason */}
                        <td className="p-2 border">{t.reason || "-"}</td>

                        {/* Date */}
                        <td className="p-2 border">
                          {new Date(t.created_at).toLocaleString("ar-EG")}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>

              {/* 🔹 Pagination Controls */}
              <div className="flex justify-center items-center gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  السابق
                </Button>

                <span className="text-sm">
                  الصفحة {pagination.page} من {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                >
                  التالي
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
