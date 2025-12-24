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

export default function PermissionsManagementPage() {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState({ open: false, permission: null });
    const router = useRouter();

    // 🔹 Fetch all permissions
    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/permissions`);
            const json = await res.json();
            if (res.ok && json.data) {
                setPermissions(json.data);
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
        fetchPermissions();
    }, []);

    // 🔹 Delete permission
    const handleDelete = async () => {
        if (!dialog.permission) return;
        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/permissions/${dialog.permission.id}`,
                { method: "DELETE" }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("تم حذف الصلاحية بنجاح");
                fetchPermissions();
            } else {
                toast.error(json.message || "حدث خطأ أثناء حذف الصلاحية");
            }
        } catch (err) {
            toast.error("خطأ في الاتصال بالخادم");
        } finally {
            setDialog({ open: false, permission: null });
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header / Create Button */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">إدارة الصلاحيات</h1>
            </div>

            {/* Permissions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-right">
                        {loading ? "جاري التحميل..." : `جميع الصلاحيات (${permissions.length})`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {permissions.length === 0 && !loading ? (
                        <p className="text-center text-muted-foreground">لا توجد صلاحيات</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border text-right">
                                <thead>
                                    <tr className="bg-muted text-sm">
                                        <th className="p-2 border">الاسم</th>
                                        <th className="p-2 border">الوصف</th>
                                        <th className="p-2 border">تاريخ الإنشاء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {permissions.map((perm) => (
                                        <tr key={perm.id} className="text-sm">
                                            <td className="p-2 border">{perm.name}</td>
                                            <td className="p-2 border">{perm.description || "-"}</td>
                                            <td className="p-2 border">
                                                {new Date(perm.created_at).toLocaleDateString("ar-EG")}
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
                        <DialogTitle>تأكيد حذف الصلاحية</DialogTitle>
                        <DialogDescription className="text-right">
                            هل أنت متأكد أنك تريد حذف الصلاحية{" "}
                            <span className="font-semibold text-primary">{dialog.permission?.name}</span>؟
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDialog({ open: false, permission: null })}>
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
