"use client";

import { useForm } from "react-hook-form";
import PageTitle from "@/components/ui/page-title";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ForgetPasswordPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const router = useRouter();

    const onSubmit = async (data) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.message || "حدث خطأ");

            toast.success(json?.message || "تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك");
            setTimeout(() => router.push("/login"), 1200);
        } catch (e) {
            toast.error(e.message || "حدث خطأ");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow p-6 space-y-6">
                <PageTitle
                    title="نسيت كلمة المرور"
                    paragraph="أدخل بريدك الإلكتروني لاستلام رابط إعادة تعيين كلمة المرور"
                />

                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <Input
                            id="email"
                            type="email"
                            aria-invalid={errors.email ? true : undefined}
                            {...register("email", {
                                required: "مطلوب",
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "بريد إلكتروني غير صالح",
                                },
                            })}
                        />
                        {errors.email && (
                            <span className="text-red-500 text-sm">{errors.email.message}</span>
                        )}
                    </div>

                    <Button className="w-full bg-primary" disabled={isSubmitting}>
                        {isSubmitting ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
