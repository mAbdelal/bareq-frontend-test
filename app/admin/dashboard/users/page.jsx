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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import fetchWithAuth from "@/lib/api";
import Link from "next/link";

const academicStatusLabels = {
    high_school_student: "طالب في المدرسة الثانوية",
    high_school_graduate: "خريج مدرسة ثانوية",
    bachelor_student: "طالب بكالوريوس",
    bachelor: "خريج بكالوريوس",
    master_student: "طالب ماجستير",
    master: "خريج ماجستير",
    phd_candidate: "طالب دكتوراه",
    phd: "خريج دكتوراه",
    alumni: "خريج",
    researcher: "باحث",
    other: "أخرى",
};

export default function SearchAcademicUsersPage() {
    const { register, handleSubmit, setValue, reset, watch } = useForm({
        defaultValues: {
            university: "",
            major: "",
            name: "",
            academic_status: "",
            is_active: "",
        },
    });

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [dialogAction, setDialogAction] = useState(null); // "activate" | "deactivate"
    const [dialogOpen, setDialogOpen] = useState(false);

    const academicStatusValue = watch("academic_status");

    const fetchInitialUsers = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/search`
            );
            const json = await res.json();
            if (res.ok) {
                setResults(json.data?.users || []);
            } else {
                toast.error(json.message || "حدث خطأ أثناء تحميل المستخدمين");
            }
        } catch {
            toast.error("خطأ في الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialUsers();
    }, []);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const params = new URLSearchParams(
                Object.fromEntries(Object.entries(data).filter(([_, v]) => v))
            );
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/search?${params.toString()}`
            );
            const json = await res.json();
            if (res.ok) {
                setResults(json.data?.users || []);
            } else {
                toast.error(json.message || "حدث خطأ أثناء البحث");
            }
        } catch {
            toast.error("خطأ في الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    const handleResetFilters = () => {
        reset();
        fetchInitialUsers();
    };

    const handleConfirmAction = async () => {
        if (!selectedUser || !dialogAction) return;

        try {
            setLoading(true);
            const url =
                dialogAction === "activate"
                    ? `${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/${selectedUser}/activate`
                    : `${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/${selectedUser}`;

            const method = dialogAction === "activate" ? "PATCH" : "DELETE";
            const res = await fetchWithAuth(url, { method });
            const json = await res.json();

            if (res.ok) {
                toast.success(
                    dialogAction === "activate"
                        ? "تم تفعيل المستخدم بنجاح"
                        : "تم تعطيل المستخدم"
                );

                // Update local state instantly
                setResults((prev) =>
                    prev.map((u) =>
                        u.user_id === selectedUser
                            ? {
                                ...u,
                                user: {
                                    ...u.user,
                                    is_active: dialogAction === "activate",
                                },
                            }
                            : u
                    )
                );
            } else {
                toast.error(json.message || "حدث خطأ أثناء تنفيذ العملية");
            }
        } catch {
            toast.error("فشل الاتصال بالخادم");
        } finally {
            setDialogOpen(false);
            setLoading(false);
            setSelectedUser(null);
            setDialogAction(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Filters Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-right">
                        بحث في المستخدمين الأكاديميين
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right"
                    >
                        {/* University */}
                        <div className="space-y-2">
                            <Label htmlFor="university">الجامعة</Label>
                            <Input
                                id="university"
                                placeholder="اسم الجامعة"
                                {...register("university")}
                            />
                        </div>

                        {/* Major */}
                        <div className="space-y-2">
                            <Label htmlFor="major">التخصص</Label>
                            <Input id="major" placeholder="اسم التخصص" {...register("major")} />
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">الاسم</Label>
                            <Input id="name" placeholder="ابحث بالاسم" {...register("name")} />
                        </div>

                        {/* Academic Status */}
                        <div className="space-y-2">
                            <Label>الحالة الأكاديمية</Label>
                            <Select
                                value={academicStatusValue}
                                onValueChange={(value) => setValue("academic_status", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الحالة الأكاديمية" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(academicStatusLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Account Status */}
                        <div className="space-y-2">
                            <Label>حالة الحساب</Label>
                            <Select
                                value={watch("is_active")}
                                onValueChange={(value) => setValue("is_active", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">نشط</SelectItem>
                                    <SelectItem value="false">غير نشط</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Submit & Reset */}
                        <div className="flex items-end justify-end gap-2">
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
                        {loading ? "جاري التحميل..." : `النتائج (${results.length})`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {results.length === 0 && !loading ? (
                        <p className="text-center text-muted-foreground">
                            لا توجد نتائج مطابقة للبحث
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border text-right">
                                <thead>
                                    <tr className="bg-muted text-sm">
                                        <th className="p-2 border">الاسم</th>
                                        <th className="p-2 border">الجامعة</th>
                                        <th className="p-2 border">التخصص</th>
                                        <th className="p-2 border">الحالة الأكاديمية</th>
                                        <th className="p-2 border">الحالة</th>
                                        <th className="p-2 border">الإجراءات</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {results.map((u) => (
                                        <tr key={u.user_id} className="text-sm">
                                            <td className="p-2 border font-medium text-primary hover:underline">
                                                <Link href={`/academics/profile/${u.user_id}`}>
                                                    {`${u.user.first_name_ar || ""} ${u.user.last_name_ar || ""
                                                        }`.trim() || "غير معروف"}
                                                </Link>
                                            </td>
                                            <td className="p-2 border">{u.university || "-"}</td>
                                            <td className="p-2 border">{u.major || "-"}</td>
                                            <td className="p-2 border">
                                                {academicStatusLabels[u.academic_status] || "-"}
                                            </td>
                                            <td
                                                className={`p-2 border font-semibold ${u.user.is_active ? "text-green-600" : "text-red-600"
                                                    }`}
                                            >
                                                {u.user.is_active ? "نشط" : "غير نشط"}
                                            </td>
                                            <td className="p-2 border text-center">
                                                <AlertDialog
                                                    open={dialogOpen && selectedUser === u.user_id}
                                                    onOpenChange={setDialogOpen}
                                                >
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant={u.user.is_active ? "destructive" : "outline"}
                                                            onClick={() => {
                                                                setSelectedUser(u.user_id);
                                                                setDialogAction(
                                                                    u.user.is_active ? "deactivate" : "activate"
                                                                );
                                                                setDialogOpen(true);
                                                            }}
                                                        >
                                                            {u.user.is_active ? "تعطيل" : "تفعيل"}
                                                        </Button>
                                                    </AlertDialogTrigger>

                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-right">
                                                                {dialogAction === "activate"
                                                                    ? "تأكيد التفعيل"
                                                                    : "تأكيد التعطيل"}
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription className="text-right">
                                                                {dialogAction === "activate"
                                                                    ? "هل أنت متأكد من أنك تريد تفعيل هذا المستخدم؟"
                                                                    : "هل أنت متأكد من أنك تريد تعطيل هذا المستخدم؟"}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="flex justify-end gap-2">
                                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleConfirmAction}>
                                                                تأكيد
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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
