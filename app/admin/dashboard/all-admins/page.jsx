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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import fetchWithAuth from "@/lib/api";

export default function AdminsManagementPage() {
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: { name: "", email: "", role: "", is_active: "" },
    });

    const [admins, setAdmins] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
    });

    const [dialog, setDialog] = useState({ open: false, action: "", admin: null });
    const [roleDialog, setRoleDialog] = useState({ open: false, admin: null, newRoleId: "" });

    // 🔹 Load roles for filter dropdown & role change
    const loadRoles = async () => {
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/roles`);
            const json = await res.json();
            if (res.ok && json.data) {
                setRoles(json.data);
            } else toast.error(json.message || "فشل تحميل الصلاحيات");
        } catch {
            toast.error("خطأ أثناء تحميل الصلاحيات");
        }
    };

    // 🔹 Fetch admins
    const fetchAdmins = async (filters = {}, page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams(
                Object.entries({ ...filters, page, limit: pagination.limit }).filter(
                    ([_, v]) => v !== undefined && v !== ""
                )
            );
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/admins/search?${params.toString()}`
            );
            const json = await res.json();

            if (res.ok && json.data) {
                const filteredAdmins = json.data.data.filter(a => a.role?.name !== "SuperAdmin");
                setAdmins(filteredAdmins);
                setPagination(json.data.pagination);
            } else toast.error(json.message || "فشل تحميل المشرفين");
        } catch {
            toast.error("خطأ في الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoles();
        fetchAdmins();
    }, []);

    const onSubmit = data => fetchAdmins(data, 1);
    const handleResetFilters = () => {
        reset();
        fetchAdmins();
    };

    const confirmAction = (action, admin) => setDialog({ open: true, action, admin });
    const handleConfirm = async () => {
        const { admin, action } = dialog;
        if (!admin) return;
        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/admins/${admin.user_id}/${action === "activate" ? "activate" : ""}`,
                { method: action === "activate" ? "PATCH" : "DELETE" }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success(action === "activate" ? "تم تفعيل الحساب بنجاح" : "تم تعطيل الحساب بنجاح");
                fetchAdmins(watch(), pagination.page);
            } else toast.error(json.message || "حدث خطأ أثناء العملية");
        } catch {
            toast.error("خطأ في الاتصال بالخادم");
        } finally {
            setDialog({ open: false, action: "", admin: null });
        }
    };

    const handleRoleChange = async () => {
        if (!roleDialog.admin || !roleDialog.newRoleId) return;
        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/admins/${roleDialog.admin.user_id}/change-role`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ newRoleId: roleDialog.newRoleId }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("تم تغيير الدور بنجاح");
                fetchAdmins(watch(), pagination.page);
            } else toast.error(json.message || "حدث خطأ أثناء تغيير الدور");
        } catch {
            toast.error("خطأ في الاتصال بالخادم");
        } finally {
            setRoleDialog({ open: false, admin: null, newRoleId: "" });
        }
    };

    const handlePageChange = newPage => {
        if (newPage >= 1 && newPage <= pagination.totalPages) fetchAdmins(watch(), newPage);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-right">بحث في المشرفين</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                        <div className="space-y-2">
                            <Label htmlFor="name">الاسم</Label>
                            <Input placeholder="ابحث بالاسم العربي أو الإنجليزي" {...register("name")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <Input placeholder="ابحث بالبريد الإلكتروني" {...register("email")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">الدور</Label>
                            <Select value={watch("role")} onValueChange={v => setValue("role", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الدور" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => (
                                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="is_active">الحالة</Label>
                            <Select value={watch("is_active")} onValueChange={v => setValue("is_active", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">نشط</SelectItem>
                                    <SelectItem value="false">غير نشط</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end justify-end gap-2 col-span-1 md:col-span-3">
                            <Button type="submit" disabled={loading}>{loading ? "جاري البحث..." : "بحث"}</Button>
                            <Button type="button" variant="outline" onClick={handleResetFilters} disabled={loading}>إزالة الفلاتر</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Admins Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-right">{loading ? "جاري التحميل..." : `النتائج (${admins.length})`}</CardTitle>
                </CardHeader>
                <CardContent>
                    {admins.length === 0 && !loading ? (
                        <p className="text-center text-muted-foreground">لا توجد نتائج مطابقة</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border text-right">
                                <thead>
                                    <tr className="bg-muted text-sm">
                                        <th className="p-2 border">الاسم الكامل</th>
                                        <th className="p-2 border">البريد الإلكتروني</th>
                                        <th className="p-2 border">الدور</th>
                                        <th className="p-2 border">الحالة</th>
                                        <th className="p-2 border">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map(admin => (
                                        <tr key={admin.user_id} className="text-sm">
                                            <td className="p-2 border">{`${admin.user?.first_name_ar || ""} ${admin.user?.last_name_ar || ""}`.trim() || admin.user?.full_name_en || "-"}</td>
                                            <td className="p-2 border">{admin.user?.email || "-"}</td>
                                            <td className="p-2 border">{admin.role?.name || "-"}</td>
                                            <td className={`p-2 border font-semibold ${admin.user?.is_active ? "text-green-600" : "text-red-600"}`}>
                                                {admin.user?.is_active ? "نشط" : "غير نشط"}
                                            </td>
                                            <td className="p-2 border text-center flex gap-2 justify-center">
                                                {admin.user?.is_active ? (
                                                    <Button size="sm" variant="destructive" onClick={() => confirmAction("deactivate", admin)}>تعطيل</Button>
                                                ) : (
                                                    <Button size="sm" variant="default" onClick={() => confirmAction("activate", admin)}>تفعيل</Button>
                                                )}
                                                <Button size="sm" variant="outline" onClick={() => setRoleDialog({ open: true, admin, newRoleId: "" })}>
                                                    تغيير الدور
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div className="flex justify-center items-center gap-3 mt-4">
                                <Button variant="outline" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>السابق</Button>
                                <span>الصفحة {pagination.page} من {pagination.totalPages}</span>
                                <Button variant="outline" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}>التالي</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Activate / Deactivate Dialog */}
            <Dialog open={dialog.open} onOpenChange={open => setDialog({ ...dialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialog.action === "activate" ? "تأكيد تفعيل الحساب" : "تأكيد تعطيل الحساب"}</DialogTitle>
                        <DialogDescription className="text-right">
                            هل أنت متأكد أنك تريد{" "}
                            <span className="font-bold">{dialog.action === "activate" ? "تفعيل" : "تعطيل"}</span> الحساب للمشرف{" "}
                            <span className="font-semibold text-primary">{`${dialog.admin?.user?.first_name_ar || ""} ${dialog.admin?.user?.last_name_ar || ""}`.trim() || dialog.admin?.user?.full_name_en}</span>؟
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDialog({ open: false, action: "", admin: null })}>إلغاء</Button>
                        <Button variant={dialog.action === "activate" ? "default" : "destructive"} onClick={handleConfirm}>تأكيد</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Role Dialog */}
            <Dialog open={roleDialog.open} onOpenChange={open => setRoleDialog({ ...roleDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تغيير الدور للمشرف</DialogTitle>
                        <DialogDescription className="text-right">
                            اختر الدور الجديد للمشرف{" "}
                            <span className="font-semibold text-primary">{`${roleDialog.admin?.user?.first_name_ar || ""} ${roleDialog.admin?.user?.last_name_ar || ""}`.trim() || roleDialog.admin?.user?.full_name_en}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <Select value={roleDialog.newRoleId} onValueChange={v => setRoleDialog({ ...roleDialog, newRoleId: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles
                                .filter(r => r.name !== "SuperAdmin" && r.name !== roleDialog.admin?.role?.name)
                                .map(role => (
                                    <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                                ))}
                        </SelectContent>
                    </Select>

                    <DialogFooter className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setRoleDialog({ open: false, admin: null, newRoleId: "" })}>إلغاء</Button>
                        <Button variant="default" onClick={handleRoleChange}>تغيير</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
