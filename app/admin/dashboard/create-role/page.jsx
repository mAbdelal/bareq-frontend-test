"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import fetchWithAuth from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function CreateRolePage() {
    const [roleForm, setRoleForm] = useState({ name: "", description: "" });
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    // Called when user confirms in dialog
    const createRole = async () => {
        if (!roleForm.name) return toast.error("اسم الدور مطلوب");
        setSubmitting(true);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/roles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: roleForm.name, description: roleForm.description }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.message || "تعذر إنشاء الدور");
            router.push("/admin/dashboard/roles");
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء إنشاء الدور");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="bg-white rounded-xl shadow p-6 max-w-md mx-auto">
                <h2 className="text-xl font-bold mb-4 text-right">إنشاء دور جديد</h2>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role_name">اسم الدور</Label>
                        <Input
                            id="role_name"
                            value={roleForm.name}
                            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role_description">الوصف</Label>
                        <Input
                            id="role_description"
                            value={roleForm.description}
                            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                        />
                    </div>
                    <Button
                        className="w-full"
                        onClick={() => setConfirmDialogOpen(true)}
                        disabled={!roleForm.name || submitting}
                    >
                        {submitting ? "جاري الحفظ..." : "إنشاء الدور"}
                    </Button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={(open) => setConfirmDialogOpen(open)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تأكيد إنشاء الدور</DialogTitle>
                        <DialogDescription className="text-right">
                            هل أنت متأكد أنك تريد إنشاء الدور{" "}
                            <span className="font-semibold">{roleForm.name}</span>؟
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialogOpen(false)}
                            disabled={submitting}
                        >
                            إلغاء
                        </Button>
                        <Button variant="default" onClick={createRole} disabled={submitting}>
                            {submitting ? "جاري الحفظ..." : "تأكيد"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
