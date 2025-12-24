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

export default function RolePermissionsPage() {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState({ open: false, role: null, permission: null, type: "" });

    // 🔹 Fetch all roles with permissions
    const fetchRolesWithPermissions = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/role-permissions`);
            const json = await res.json();
            if (res.ok && json.data) {
                // Filter out SuperAdmin and BasicAdmin
                const filteredRoles = json.data.filter(
                    (role) => role.name !== "SuperAdmin" && role.name !== "BasicAdmin"
                );
                setRoles(filteredRoles);
            } else {
                toast.error(json.message || "فشل تحميل الأدوار والصلاحيات");
            }
        } catch {
            toast.error("خطأ في الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Fetch all available permissions
    const fetchPermissions = async () => {
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/permissions`);
            const json = await res.json();
            if (res.ok && json.data) setPermissions(json.data);
            else toast.error(json.message || "فشل تحميل الصلاحيات");
        } catch {
            toast.error("خطأ في الاتصال بالخادم");
        }
    };

    useEffect(() => {
        fetchRolesWithPermissions();
        fetchPermissions();
    }, []);

    const handleAssignOrRemove = async () => {
        if (!dialog.role || !dialog.permission) return;
        const endpoint = dialog.type === "assign" ? "assign" : "remove";

        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/role-permissions/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role_id: dialog.role.id, permission_id: dialog.permission.id }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.message || "حدث خطأ");
            toast.success(dialog.type === "assign" ? "تمت إضافة الصلاحية" : "تمت إزالة الصلاحية");
            fetchRolesWithPermissions();
            setDialog({ open: false, role: null, permission: null, type: "" });
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء العملية");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">إدارة الأدوار والصلاحيات</h1>

            {loading ? (
                <p className="text-center">جاري التحميل...</p>
            ) : roles.length === 0 ? (
                <p className="text-center text-muted-foreground">لا توجد أدوار</p>
            ) : (
                roles.map((role) => (
                    <Card key={role.id}>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-right">{role.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-right mb-2">{role.description || "-"}</p>

                            {/* Display permissions */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {role.permissions && role.permissions.length > 0 ? (
                                    role.permissions.map((perm) => (
                                        <Button
                                            key={perm.id}
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setDialog({ open: true, role, permission: perm, type: "remove" })
                                            }
                                        >
                                            {perm.name} ✕
                                        </Button>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground">لا توجد صلاحيات</span>
                                )}
                            </div>

                            {/* Assign permission dropdown */}
                            <select
                                className="border p-2 rounded-md mt-2"
                                onChange={(e) => {
                                    const perm = permissions.find((p) => p.id === parseInt(e.target.value));
                                    if (perm) setDialog({ open: true, role, permission: perm, type: "assign" });
                                }}
                                value=""
                            >
                                <option value="">إضافة صلاحية</option>
                                {permissions
                                    .filter((p) => !role.permissions?.some((rp) => rp.id === p.id))
                                    .map((perm) => (
                                        <option key={perm.id} value={perm.id}>
                                            {perm.name}
                                        </option>
                                    ))}
                            </select>
                        </CardContent>
                    </Card>
                ))
            )}

            {/* Confirm Dialog */}
            <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
                <DialogContent className="direction-rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle>
                            {dialog.type === "assign" ? "تأكيد إضافة الصلاحية" : "تأكيد إزالة الصلاحية"}
                        </DialogTitle>
                        <DialogDescription className="text-right">
                            هل أنت متأكد أنك تريد {dialog.type === "assign" ? "إضافة" : "إزالة"} الصلاحية{" "}
                            <span className="font-semibold">{dialog.permission?.name}</span>{" "}
                            {dialog.type === "assign" ? "لـ" : "من"} <span className="font-semibold">{dialog.role?.name}</span>؟
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setDialog({ open: false, role: null, permission: null, type: "" })}
                        >
                            إلغاء
                        </Button>
                        <Button variant="default" onClick={handleAssignOrRemove}>
                            تأكيد
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
