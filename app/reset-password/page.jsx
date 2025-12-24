"use client";

import { useForm } from "react-hook-form";
import PageTitle from "@/components/ui/page-title";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function isStrongPassword(pw) {
    if (!pw || typeof pw !== "string") return false;
    if (pw.length < 8) return false;
    return /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
}

function ResetPasswordContent() {
    const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams?.get("token") || "";

    const onSubmit = async (data) => {
        if (!token) {
            toast.error("رمز إعادة التعيين غير صالح أو مفقود");
            return;
        }

        if (!isStrongPassword(data.password)) {
            toast.error("كلمة المرور ضعيفة: يجب أن تكون مكونة من 8 أحرف على الأقل وتحتوي على أحرف وأرقام");
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: data.password }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.message || "فشل في إعادة تعيين كلمة المرور");

            toast.success(json?.message || "تمت إعادة تعيين كلمة المرور بنجاح");
            setTimeout(() => router.push("/login"), 1200);
        } catch (e) {
            toast.error(e.message || "حدث خطأ غير متوقع");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow p-6 space-y-6 text-right" dir="rtl">
                <PageTitle
                    title="إعادة تعيين كلمة المرور"
                    paragraph="أدخل كلمة المرور الجديدة الخاصة بك"
                />

                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    {/* New Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">كلمة المرور الجديدة</Label>
                        <Input
                            id="password"
                            type="password"
                            aria-invalid={errors.password ? true : undefined}
                            {...register("password", { required: "مطلوب" })}
                        />
                        {errors.password && (
                            <span className="text-red-500 text-sm">{errors.password.message}</span>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
                        <Input
                            id="confirm"
                            type="password"
                            aria-invalid={errors.confirm ? true : undefined}
                            {...register("confirm", {
                                required: "مطلوب",
                                validate: (v) =>
                                    v === watch("password") || "كلمتا المرور غير متطابقتين",
                            })}
                        />
                        {errors.confirm && (
                            <span className="text-red-500 text-sm">{errors.confirm.message}</span>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button className="w-full bg-primary" disabled={isSubmitting}>
                        {isSubmitting ? "جاري الحفظ..." : "إعادة التعيين"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>جاري التحميل...</div></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
