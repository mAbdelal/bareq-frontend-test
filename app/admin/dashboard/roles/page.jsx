"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import fetchWithAuth from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RolesManagementPage() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState({ open: false, role: null });
    const router = useRouter();

    // 🔹 Fetch all roles
    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/roles`);
            const json = await res.json();
            if (res.ok && json.data) {
                // Filter out SuperAdmin role
                const filteredRoles = json.data.filter((role) => role.name !== "SuperAdmin");
                setRoles(filteredRoles);
            } else {
                toast.error(json.message || "فشل تحميل الصلاحيات");
            }
        } catch (err) {
            toast.error("خطأ في الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDelete = async () => {
        if (!dialog.role) return;
        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/roles/${dialog.role.id}`,
                { method: "DELETE" }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("تم حذف الدور بنجاح");
                fetchRoles();
            } else {
                toast.error(json.message || "حدث خطأ أثناء حذف الدور");
            }
        } catch (err) {
            toast.error("خطأ في الاتصال بالخادم");
        } finally {
            setDialog({ open: false, role: null });
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header / Create Button */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">إدارة الأدوار</h1>
                <Button onClick={() => router.push("/admin/dashboard/create-role")}>إنشاء دور جديد</Button>
            </div>

            {/* Roles Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-right">
                        {loading ? "جاري التحميل..." : `جميع الأدوار (${roles.length})`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {roles.length === 0 && !loading ? (
                        <p className="text-center text-muted-foreground">لا توجد أدوار</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border text-right">
                                <thead>
                                    <tr className="bg-muted text-sm">
                                        <th className="p-2 border">الاسم</th>
                                        <th className="p-2 border">الوصف</th>
                                        <th className="p-2 border">تاريخ الإنشاء</th>
                                        <th className="p-2 border">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roles.map((role) => (
                                        <tr key={role.id} className="text-sm">
                                            <td className="p-2 border">{role.name}</td>
                                            <td className="p-2 border">{role.description || "-"}</td>
                                            <td className="p-2 border">
                                                {new Date(role.created_at).toLocaleDateString("ar-EG")}
                                            </td>
                                            <td className="p-2 border text-center flex gap-2 justify-center">
                                                {role.name !== "BasicAdmin" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => setDialog({ open: true, role })}
                                                        >
                                                            حذف
                                                        </Button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تأكيد حذف الدور</DialogTitle>
                        <DialogDescription className="text-right">
                            هل أنت متأكد أنك تريد حذف الدور{" "}
                            <span className="font-semibold text-primary">{dialog.role?.name}</span>؟
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDialog({ open: false, role: null })}>
                            إلغاء
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            حذف
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
