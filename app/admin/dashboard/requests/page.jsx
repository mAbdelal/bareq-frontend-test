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
import Link from "next/link";

const requestStatusLabels = {
    open: "مفتوح",
    in_progress: "قيد التنفيذ",
    submitted: "تم التسليم",
    disputed_by_provider: "نزاع (مقدم الخدمة)",
    disputed_by_owner: "نزاع (المالك)",
    owner_rejected: "مرفوض من المالك",
    completed: "مكتمل",
};

export default function AdminRequestsPage() {
    const { register, handleSubmit, setValue, reset, watch } = useForm({
        defaultValues: {
            title: "",
            status: "",
            requester_name: "",
            academic_category_id: "",
            academic_subcategory_id: "",
            expected_delivery_days: "",
            min_budget: "",
            max_budget: "",
            skills: "",
        },
    });

    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [total, setTotal] = useState(0);

    const selectedCategory = watch("academic_category_id");

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/academic-categories/public`, { cache: 'no-store' });
                const json = await res.json();
                if (res.ok) {
                    // Map backend response to {id, name} format
                    setCategories(json.data.map(cat => ({ id: cat.id, name: cat.name })));
                } else {
                    toast.error(json.message || "فشل تحميل الفئات الأكاديمية");
                }
            } catch (err) {
                toast.error("خطأ أثناء تحميل الفئات");
            }
        };
        fetchCategories();
    }, []);

    // Fetch subcategories when category changes
    useEffect(() => {
        const fetchSubcategories = async () => {
            if (!selectedCategory) {
                setSubcategories([]);
                return;
            }
            try {
                const res = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/academic-subcategories/${selectedCategory}/public`
                );
                const json = await res.json();
                if (res.ok) {
                    setSubcategories(json.data.map(sub => ({ id: sub.id, name: sub.name })));
                } else {
                    toast.error(json.message || "فشل تحميل الفئات الفرعية");
                }
            } catch (err) {
                toast.error("خطأ أثناء تحميل الفئات الفرعية");
            }
        };
        fetchSubcategories();
    }, [selectedCategory]);

    // Fetch requests with filters
    const fetchRequests = async (filters = {}) => {
        setLoading(true);
        try {
            // Only send IDs, not names
            const paramsObj = { ...filters };
            const params = new URLSearchParams(
                Object.fromEntries(Object.entries(paramsObj).filter(([_, v]) => v))
            );

            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/requests/search/admin?${params.toString()}`
            );
            const json = await res.json();

            if (res.ok) {
                setRequests(json.data?.data || []);
                setTotal(json.data?.total || 0);
            } else {
                toast.error(json.message || "حدث خطأ أثناء تحميل الطلبات");
            }
        } catch (err) {
            toast.error("خطأ في الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const onSubmit = async (data) => {
        // Ensure category/subcategory IDs are sent as numbers
        const payload = {
            ...data,
            academic_category_id: data.academic_category_id ? Number(data.academic_category_id) : undefined,
            academic_subcategory_id: data.academic_subcategory_id ? Number(data.academic_subcategory_id) : undefined,
        };
        await fetchRequests(payload);
    };

    const handleResetFilters = () => {
        reset();
        fetchRequests();
    };

    return (
        <div className="p-6 space-y-6">
            {/* Filters Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-right">
                        بحث في الطلبات الأكاديمية
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right"
                    >
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">العنوان</Label>
                            <Input id="title" placeholder="ابحث بعنوان الطلب" {...register("title")} />
                        </div>

                        {/* Requester Name */}
                        <div className="space-y-2">
                            <Label htmlFor="requester_name">اسم الطالب</Label>
                            <Input
                                id="requester_name"
                                placeholder="ابحث باسم الطالب"
                                {...register("requester_name")}
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label>الحالة</Label>
                            <Select
                                value={watch("status")}
                                onValueChange={(value) => setValue("status", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(requestStatusLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label>الفئة</Label>
                            <Select
                                value={watch("academic_category_id")}
                                onValueChange={(value) => {
                                    setValue("academic_category_id", value);
                                    setValue("academic_subcategory_id", "");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الفئة الأكاديمية" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Subcategory */}
                        <div className="space-y-2">
                            <Label>الفئة الفرعية</Label>
                            <Select
                                value={watch("academic_subcategory_id")}
                                onValueChange={(value) =>
                                    setValue("academic_subcategory_id", value)
                                }
                                disabled={!subcategories.length}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الفئة الفرعية" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subcategories.map((sub) => (
                                        <SelectItem key={sub.id} value={String(sub.id)}>
                                            {sub.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Expected Delivery */}
                        <div className="space-y-2">
                            <Label htmlFor="expected_delivery_days">مدة التنفيذ (أيام)</Label>
                            <Input
                                id="expected_delivery_days"
                                type="number"
                                {...register("expected_delivery_days")}
                            />
                        </div>

                        {/* Budget Min */}
                        <div className="space-y-2">
                            <Label htmlFor="min_budget">الحد الأدنى للميزانية</Label>
                            <Input id="min_budget" type="number" {...register("min_budget")} />
                        </div>

                        {/* Budget Max */}
                        <div className="space-y-2">
                            <Label htmlFor="max_budget">الحد الأعلى للميزانية</Label>
                            <Input id="max_budget" type="number" {...register("max_budget")} />
                        </div>

                        {/* Skills */}
                        <div className="space-y-2">
                            <Label htmlFor="skills">المهارات</Label>
                            <Input
                                id="skills"
                                placeholder="اكتب مهارات مفصولة بفواصل"
                                {...register("skills")}
                            />
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

            {/* Results Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-right">
                        {loading ? "جاري التحميل..." : `النتائج (${requests.length})`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 && !loading ? (
                        <p className="text-center text-muted-foreground">
                            لا توجد طلبات مطابقة للبحث
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border text-right">
                                <thead>
                                    <tr className="bg-muted text-sm">
                                        <th className="p-2 border">العنوان</th>
                                        <th className="p-2 border">اسم الطالب</th>
                                        <th className="p-2 border">الفئة</th>
                                        <th className="p-2 border">الميزانية</th>
                                        <th className="p-2 border">المدة</th>
                                        <th className="p-2 border">الحالة</th>
                                        <th className="p-2 border">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((r) => (
                                        <tr key={r.id} className="text-sm">
                                            <td className="p-2 border font-medium text-primary hover:underline">
                                                <Link href={`/requests/private/${r.id}`}>{r.title}</Link>
                                            </td>
                                            <td className="p-2 border">
                                                {r.requester?.user
                                                    ? `${r.requester.user.first_name_ar} ${r.requester.user.last_name_ar}`
                                                    : "غير معروف"}
                                            </td>
                                            <td className="p-2 border">
                                                {r.category?.name || "-"}
                                            </td>
                                            <td className="p-2 border">
                                                {r.budget ? `${r.budget} $` : "-"}
                                            </td>
                                            <td className="p-2 border">
                                                {r.expected_delivery_days || "-"}
                                            </td>
                                            <td
                                                className={`p-2 border font-semibold ${r.status === "completed"
                                                    ? "text-green-600"
                                                    : r.status.includes("disputed")
                                                        ? "text-red-600"
                                                        : "text-blue-600"
                                                    }`}
                                            >
                                                {requestStatusLabels[r.status] || r.status}
                                            </td>
                                            <td className="p-2 border text-center">
                                                <Link href={`/requests/private/${r.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        عرض
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
