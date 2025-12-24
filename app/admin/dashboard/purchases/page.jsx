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

const purchaseStatusLabels = {
    pending: "قيد الانتظار",
    in_progress: "قيد التنفيذ",
    submitted: "تم التسليم",
    completed: "مكتمل",
    rejected: "مرفوض",
    disputed_by_provider: "نزاع (مقدم الخدمة)",
    disputed_by_buyer: "نزاع (المالك)",
};

export default function AdminPurchasesPage() {
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            service_id: "",
            buyer_name: "",
            provider_name: "",
            service_name: "",
            status: "",
            from_date: "",
            to_date: "",
        },
    });

    const [loading, setLoading] = useState(false);
    const [purchases, setPurchases] = useState([]);
    const [total, setTotal] = useState(0);

    const fetchPurchases = async (filters = {}) => {
        setLoading(true);
        try {
            const params = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            );
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/purchases/search/admin?${params.toString()}`
            );
            const json = await res.json();

            if (res.ok) {
                setPurchases(json.data.purchases || []);
                setTotal(json.data.meta?.total || 0);
            } else {
                toast.error(json.message || "حدث خطأ أثناء تحميل المشتريات");
            }
        } catch (err) {
            toast.error("خطأ في الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, []);

    const onSubmit = async (data) => {
        await fetchPurchases(data);
    };

    const handleResetFilters = () => {
        reset();
        fetchPurchases();
    };

    return (
        <div className="p-6 space-y-6">
            {/* Filters Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-right">بحث في المشتريات</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                        {/* Service ID */}
                        <div className="space-y-2">
                            <Label htmlFor="service_id">رقم الخدمة</Label>
                            <Input placeholder="ابحث برقم الخدمة" {...register("service_id")} />
                        </div>

                        {/* Buyer Name */}
                        <div className="space-y-2">
                            <Label htmlFor="buyer_name">اسم المشتري</Label>
                            <Input placeholder="ابحث باسم المشتري" {...register("buyer_name")} />
                        </div>

                        {/* Provider Name */}
                        <div className="space-y-2">
                            <Label htmlFor="provider_name">اسم مقدم الخدمة</Label>
                            <Input placeholder="ابحث باسم مقدم الخدمة" {...register("provider_name")} />
                        </div>

                        {/* Service Name */}
                        <div className="space-y-2">
                            <Label htmlFor="service_name">اسم الخدمة</Label>
                            <Input placeholder="ابحث باسم الخدمة" {...register("service_name")} />
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
                                    {Object.entries(purchaseStatusLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            <Button type="button" variant="outline" onClick={handleResetFilters} disabled={loading}>
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
                        {loading ? "جاري التحميل..." : `النتائج (${purchases.length})`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {purchases.length === 0 && !loading ? (
                        <p className="text-center text-muted-foreground">لا توجد مشتريات مطابقة للبحث</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border text-right">
                                <thead>
                                    <tr className="bg-muted text-sm">
                                        <th className="p-2 border">الخدمة</th>
                                        <th className="p-2 border">اسم المشتري</th>
                                        <th className="p-2 border">مقدم الخدمة</th>
                                        <th className="p-2 border">الحالة</th>
                                        <th className="p-2 border">تاريخ الشراء</th>
                                        <th className="p-2 border">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchases.map((p) => (
                                        <tr key={p.id} className="text-sm">
                                            <td className="p-2 border font-medium text-primary hover:underline">
                                                <Link href={`/services/private/${p.service?.id}`}>{p.service?.title || "-"}</Link>
                                            </td>
                                            <td className="p-2 border">
                                                {p.buyer?.user
                                                    ? `${p.buyer.user.first_name_ar} ${p.buyer.user.last_name_ar}`
                                                    : "-"}
                                            </td>
                                            <td className="p-2 border">
                                                {p.service?.provider?.user
                                                    ? `${p.service.provider.user.first_name_ar} ${p.service.provider.user.last_name_ar}`
                                                    : "-"}
                                            </td>
                                            <td
                                                className={`p-2 border font-semibold ${p.status === "completed"
                                                    ? "text-green-600"
                                                    : p.status.includes("disputed")
                                                        ? "text-red-600"
                                                        : "text-blue-600"
                                                    }`}
                                            >
                                                {purchaseStatusLabels[p.status] || p.status}
                                            </td>
                                            <td className="p-2 border">{new Date(p.created_at).toLocaleDateString()}</td>
                                            <td className="p-2 border text-center">
                                                <Link href={`/purchases/${p.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        عرض تفاصيل الشراء
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
