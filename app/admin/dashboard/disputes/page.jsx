"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Loader from "@/components/ui/Loader";
import fetchWithAuth from "@/lib/api";
import { cn } from "@/lib/utils";
import { translateDisputeStatus } from "@/lib/translations";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    complainant_id: "",
    respondent_id: "",
    from_date: "",
    to_date: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, content: "", x: 0, y: 0 });

  const limit = 10;

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '' && value !== 'all') {
        params.append(key, value);
      }
    });

    return params.toString();
  };

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        setLoading(true);
        const queryString = buildQueryString();
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_BASE_URL}/disputes/search?${queryString}`
        );
        const json = await res.json();
        setDisputes(json?.data.data || []);
        setTotalPages(json?.data.pagination?.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch disputes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, [page, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      complainant_id: "",
      respondent_id: "",
      from_date: "",
      to_date: ""
    });
    setPage(1);
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'status') {
        return value && value !== 'all';
      }
      return value && value.trim() !== '';
    }).length;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم النسخ بنجاح");
    } catch (err) {
      toast.error("فشل النسخ");
    }
  };

  const handleMouseEnter = (e, userId, userName) => {
    const rect = e.target.getBoundingClientRect();
    setTooltip({
      show: true,
      content: `معرف المستخدم: \n${userId}\nاضغط للنسخ`,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, content: "", x: 0, y: 0 });
  };

  const handleNameClick = (userId) => {
    copyToClipboard(userId);
    setTooltip({ show: false, content: "", x: 0, y: 0 });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statusOptions = [
    { value: "all", label: "جميع الحالات" },
    { value: "open", label: "مفتوح" },
    { value: "under_review", label: "قيد المراجعة" },
    { value: "resolved", label: "محلول" },
    { value: "rejected", label: "مرفوض" }
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="كل النزاعات"
        description="عرض وإدارة النزاعات المفتوحة والمغلقة"
      />

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">تصفية النزاعات</h3>
              {getActiveFiltersCount() > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {getActiveFiltersCount()} فلتر نشط
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
              >
                {showFilters ? "إخفاء الفلاتر" : "إظهار الفلاتر"}
              </Button>
              {getActiveFiltersCount() > 0 && (
                <Button variant="outline" onClick={clearFilters} size="sm">
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Complainant ID Filter */}
              <div className="space-y-2">
                <Label htmlFor="complainant_id">معرف مقدم الشكوى</Label>
                <Input
                  id="complainant_id"
                  type="text"
                  placeholder="أدخل معرف المستخدم"
                  value={filters.complainant_id}
                  onChange={(e) => handleFilterChange("complainant_id", e.target.value)}
                />
                <p className="text-xs text-gray-500"> مرر الماوس على اسم المستخدم في الجدول للحصول على المعرف</p>
              </div>

              {/* Respondent ID Filter */}
              <div className="space-y-2">
                <Label htmlFor="respondent_id">معرف المدعى عليه</Label>
                <Input
                  id="respondent_id"
                  type="text"
                  placeholder="أدخل معرف المستخدم"
                  value={filters.respondent_id}
                  onChange={(e) => handleFilterChange("respondent_id", e.target.value)}
                />
                <p className="text-xs text-gray-500"> مرر الماوس على اسم المستخدم في الجدول للحصول على المعرف</p>
              </div>

              {/* From Date Filter */}
              <div className="space-y-2">
                <Label htmlFor="from_date">من تاريخ</Label>
                <Input
                  id="from_date"
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => handleFilterChange("from_date", e.target.value)}
                />
              </div>

              {/* To Date Filter */}
              <div className="space-y-2">
                <Label htmlFor="to_date">إلى تاريخ</Label>
                <Input
                  id="to_date"
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => handleFilterChange("to_date", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader />
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-lg">
            لا توجد نزاعات حالياً
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 text-gray-600 text-right">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">مقدم الشكوى</th>
                  <th className="px-4 py-3">المدعى عليه</th>
                  <th className="px-4 py-3">الوصف</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">تاريخ الإنشاء</th>
                  <th className="px-4 py-3">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((dispute, index) => (
                  <tr
                    key={dispute.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">{(page - 1) * limit + index + 1}</td>
                    <td className="px-4 py-3">
                      <span
                        className="cursor-pointer hover:text-primary transition-colors"
                        onMouseEnter={(e) => handleMouseEnter(e, dispute.complainant?.user?.id, `${dispute.complainant?.user?.first_name_ar} ${dispute.complainant?.user?.last_name_ar}`)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleNameClick(dispute.complainant?.user?.id)}
                      >
                        {dispute.complainant?.user?.first_name_ar}{" "}
                        {dispute.complainant?.user?.last_name_ar}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="cursor-pointer hover:text-primary transition-colors"
                        onMouseEnter={(e) => handleMouseEnter(e, dispute.respondent?.user?.id, `${dispute.respondent?.user?.first_name_ar} ${dispute.respondent?.user?.last_name_ar}`)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleNameClick(dispute.respondent?.user?.id)}
                      >
                        {dispute.respondent?.user?.first_name_ar}{" "}
                        {dispute.respondent?.user?.last_name_ar}
                      </span>
                    </td>
                    <td className="px-4 py-3 truncate max-w-[200px]">
                      {dispute.description}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getStatusColor(dispute.status)
                        )}
                      >
                        {translateDisputeStatus(dispute.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(dispute.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/disputes/${dispute.id}`)
                        }
                      >
                        عرض التفاصيل
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            السابق
          </Button>
          <span>
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="whitespace-pre-line text-center">
            {tooltip.content}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}

