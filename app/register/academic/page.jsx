"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SignUpPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            first_name_ar: "",
            last_name_ar: "",
            full_name_en: "",
            email: "",
            username: "",
            academic_status: "",
            password: "",
            confirmPassword: "",
            terms: false,
        },
    });

    const password = watch("password");

    const onSubmit = async (data) => {
        setLoading(true);


        if (!data.terms) {
            toast.warning("يجب الموافقة على شروط الاستخدام");
            setLoading(false);
            return;
        }

        if (data.password !== data.confirmPassword) {
            toast.error("كلمتا المرور غير متطابقتين");
            setLoading(false);
            return;
        }

        try {
            const body = {
                email: data.email,
                username: data.username,
                password: data.password,
                first_name_ar: data.first_name_ar,
                last_name_ar: data.last_name_ar,
                full_name_en: data.full_name_en,
                academicData: {
                    academic_status: data.academic_status,
                },
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/register/academic`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                credentials: "include",
            });

            const json = await res.json();

            if (!res.ok) throw new Error(json.message || "فشل التسجيل");

            toast.success("تم إنشاء الحساب بنجاح");

            // Redirect after success
            router.push("/login");
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء التسجيل");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center mt-10 p-4">
            <div className="w-full max-w-xl bg-white p-10 rounded-3xl shadow-xl border border-gray-200">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">تسجيل أكاديمي جديد</h2>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition mb-6"
                    onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/google`}
                >
                    <div className="flex items-center justify-center w-5 h-5">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 48 48"
                            className="w-5 h-5"
                        >
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.6l6.85-6.85C35.08 2.96 29.88 1 24 1 14.64 1 6.68 6.44 2.69 14.26l7.96 6.18C12.47 14.02 17.74 9.5 24 9.5z" />
                            <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.2-.43-4.73H24v9.02h12.43c-.55 2.95-2.2 5.45-4.7 7.13l7.24 5.63c4.24-3.91 6.63-9.66 6.63-16.05z" />
                            <path fill="#4A90E2" d="M9.05 28.44a14.5 14.5 0 0 1 0-8.87L1.09 13.4A23.942 23.942 0 0 0 0 24c0 3.89.93 7.58 2.59 10.86l7.46-6.42z" />
                            <path fill="#FBBC05" d="M24 47c6.48 0 11.92-2.13 15.89-5.83l-7.24-5.63c-2.03 1.36-4.63 2.16-8.65 2.16-6.26 0-11.53-4.52-13.35-10.63l-7.96 6.18C6.68 41.56 14.64 47 24 47z" />
                        </svg>
                    </div>
                    <span>التسجيل باستخدام Google</span>
                </Button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">أو</span>
                    </div>
                </div>

                <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit(onSubmit)}>

                    {/* First Name Arabic */}
                    <div className="flex flex-col">
                        <label className="mb-1 font-medium">الاسم الأول بالعربية</label>
                        <input
                            {...register("first_name_ar", { required: "هذا الحقل مطلوب" })}
                            className={`border rounded-xl p-3 focus:outline-none focus:ring-2 ${errors.first_name_ar ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                        />
                        {errors.first_name_ar && <span className="text-red-500 text-sm mt-1">{errors.first_name_ar.message}</span>}
                    </div>

                    {/* Last Name Arabic */}
                    <div className="flex flex-col">
                        <label className="mb-1 font-medium">اسم العائلة بالعربية</label>
                        <input
                            {...register("last_name_ar", { required: "هذا الحقل مطلوب" })}
                            className={`border rounded-xl p-3 focus:outline-none focus:ring-2 ${errors.last_name_ar ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                        />
                        {errors.last_name_ar && <span className="text-red-500 text-sm mt-1">{errors.last_name_ar.message}</span>}
                    </div>

                    {/* Full Name English */}
                    <div className="flex flex-col">
                        <label className="mb-1 font-medium">الاسم الكامل بالإنجليزية</label>
                        <input
                            {...register("full_name_en", { required: "هذا الحقل مطلوب" })}
                            className={`border rounded-xl p-3 focus:outline-none focus:ring-2 ${errors.full_name_en ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                        />
                        {errors.full_name_en && <span className="text-red-500 text-sm mt-1">{errors.full_name_en.message}</span>}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col">
                        <label className="mb-1 font-medium">البريد الإلكتروني</label>
                        <input
                            type="email"
                            {...register("email", { required: "هذا الحقل مطلوب" })}
                            className={`border rounded-xl p-3 focus:outline-none focus:ring-2 ${errors.email ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                        />
                        {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>}
                    </div>

                    {/* Username */}
                    <div className="flex flex-col">
                        <label className="mb-1 font-medium">اسم المستخدم</label>
                        <input
                            {...register("username", { required: "هذا الحقل مطلوب" })}
                            placeholder="أدخل اسم المستخدم الفريد"
                            className={`border rounded-xl p-3 focus:outline-none focus:ring-2 ${errors.username ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                        />
                        {errors.username && <span className="text-red-500 text-sm mt-1">{errors.username.message}</span>}
                    </div>

                    {/* Academic Status */}
                    <div className="flex flex-col">
                        <label className="mb-1 font-medium">الحالة الأكاديمية</label>
                        <select
                            {...register("academic_status", { required: "هذا الحقل مطلوب" })}
                            className={`border rounded-xl p-3 focus:outline-none focus:ring-2 ${errors.academic_status ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                        >
                            <option value="">اختر الحالة الأكاديمية</option>
                            <option value="bachelor_student">طالب بكالوريوس</option>
                            <option value="bachelor">بكالوريوس</option>
                            <option value="master_student">طالب ماجستير</option>
                            <option value="master">ماجستير</option>
                            <option value="phd_candidate">طالب دكتوراه</option>
                            <option value="phd">دكتوراه</option>
                            <option value="other">أخرى</option>
                        </select>
                        {errors.academic_status && <span className="text-red-500 text-sm mt-1">{errors.academic_status.message}</span>}
                    </div>

                    {/* Password */}
                    <div className="flex flex-col">
                        <label className="mb-1 font-medium">كلمة المرور</label>
                        <input
                            type="password"
                            {...register("password", { required: "هذا الحقل مطلوب", minLength: { value: 8, message: "يجب أن تكون كلمة المرور 8 أحرف على الأقل" } })}
                            className={`border rounded-xl p-3 focus:outline-none focus:ring-2 ${errors.password ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                        />
                        {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password.message}</span>}
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col">
                        <label className="mb-1 font-medium">تأكيد كلمة المرور</label>
                        <input
                            type="password"
                            {...register("confirmPassword", { required: "يرجى تأكيد كلمة المرور" })}
                            className={`border rounded-xl p-3 focus:outline-none focus:ring-2 ${errors.confirmPassword ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                        />
                        {errors.confirmPassword && <span className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</span>}
                    </div>

                    {/* Terms */}
                    <div className="flex items-center gap-2">
                        <input type="checkbox" {...register("terms")} className="w-5 h-5" />
                        <label className="text-sm">
                            بالتسجيل أنت توافق على <Link href="/terms" className="text-primary underline">شروط الاستخدام</Link>
                        </label>
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className={`w-full bg-primary text-white py-3 rounded-xl shadow-lg hover:bg-primary/80 transition ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                        disabled={loading}
                    >
                        {loading ? "جار التسجيل..." : "حساب جديد"}
                    </Button>
                </form>

                <p className="mt-6 text-center text-gray-600 text-sm">
                    لديك حساب؟ <Link href="/login" className="text-primary font-medium hover:underline">تسجيل الدخول</Link>
                </p>
            </div>
        </div>
    );
}
