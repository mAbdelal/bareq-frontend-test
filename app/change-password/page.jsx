"use client";

import { useForm } from "react-hook-form";
import PageTitle from "@/components/ui/page-title";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import fetchWithAuth from "@/lib/api";

function isStrongPassword(pw) {
    if (!pw || typeof pw !== "string") return false;
    if (pw.length < 8) return false;
    return /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
}

export default function ChangePasswordPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();
    const { state } = useUser();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (state.user === undefined) return;

        if (state.user === null) {
            router.replace("/login");
            return;
        }

        if (state.user?.role) {
            router.replace("/admin/dashboard");
            return;
        }
    }, [state.user, router]);

    const onSubmit = async (data) => {
        if (!isStrongPassword(data.new)) {
            toast.error("كلمة المرور ضعيفة: يجب أن تكون مكونة من 8 أحرف على الأقل وتحتوي على أحرف وأرقام");
            return;
        }

        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPassword: data.current, newPassword: data.new }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.message || "فشل في تغيير كلمة المرور");

            toast.success("تم تغيير كلمة المرور بنجاح");
            reset({ current: "", new: "" });
        } catch (e) {
            toast.error(e.message || "حدث خطأ غير متوقع");
        }
    };

    if (state.user === undefined) return null;
    if (!state.user || state.user?.role) return null;

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow p-6 space-y-6 text-right" dir="rtl">
                <PageTitle title="تغيير كلمة المرور" paragraph="قم بتحديث كلمة المرور الخاصة بك" />

                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    {/* Current Password */}
                    <div className="space-y-2">
                        <Label htmlFor="current">كلمة المرور الحالية</Label>
                        <Input
                            id="current"
                            type={showPassword ? "text" : "password"}
                            aria-invalid={errors.current ? true : undefined}
                            {...register("current", { required: "مطلوب" })}
                        />
                        {errors.current && (
                            <span className="text-red-500 text-sm">{errors.current.message}</span>
                        )}

                        <div className="flex items-center space-x-2 rtl:space-x-reverse gap-2 mt-1">
                            <input
                                id="showPassword"
                                type="checkbox"
                                checked={showPassword}
                                onChange={() => setShowPassword(!showPassword)}
                                className="cursor-pointer accent-primary"
                            />
                            <Label htmlFor="showPassword" className="cursor-pointer text-sm">
                                إظهار كلمة المرور
                            </Label>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2 mt-7">
                        <Label htmlFor="new">كلمة المرور الجديدة</Label>
                        <Input
                            id="new"
                            type={showPassword ? "text" : "password"}
                            aria-invalid={errors.new ? true : undefined}
                            {...register("new", { required: "مطلوب" })}
                        />
                        {errors.new && (
                            <span className="text-red-500 text-sm">{errors.new.message}</span>
                        )}
                    </div>

                    <Button className="w-full bg-primary" disabled={isSubmitting}>
                        {isSubmitting ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
