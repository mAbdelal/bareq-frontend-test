"use client";

export const dynamic = 'force-dynamic';

import { useForm } from "react-hook-form";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import fetchWithAuth from "@/lib/api";
import { useState, useEffect } from "react";


export default function RegisterAdminPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,

  } = useForm();

  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/roles`);
        const json = await res.json();

        if (res.ok && json.data) {
          const simplifiedRoles = json.data.map((role) => ({
            id: role.id,
            name: role.name,
          })).filter(r => r.name !== "SuperAdmin");
          setRoles(simplifiedRoles);
        } else {
          toast.error(json.message || "فشل تحميل الصلاحيات");
        }
      } catch (err) {
        toast.error("خطأ أثناء تحميل الصلاحيات");
      }
    };

    loadRoles();
  }, []);


  const onSubmit = async (data) => {
    console.log({ data })
    try {
      const payload = {
        email: data.email,
        username: data.username,
        password: data.password,
        first_name_ar: data.first_name_ar || "",
        last_name_ar: data.last_name_ar || "",
        full_name_en: data.full_name_en || "",
        role_id: Number.parseInt(data.role_id),
      };

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/register/admin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json?.message || "تعذر إنشاء الأدمن");

      toast.success("تم إنشاء الأدمن بنجاح");
      reset({
        email: "",
        username: "",
        password: "",
        first_name_ar: "",
        last_name_ar: "",
        full_name_en: "",
        role_id: "",
      });
    } catch (e) {
      toast.error(e.message || "حدث خطأ أثناء الحفظ");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="تسجيل أدمن جديد"
        description="أدخل بيانات الأدمن الجديد واحفظها في النظام"
      />

      <div className="bg-white rounded-xl shadow p-6">
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* First Name (Arabic) */}
          <div className="space-y-2">
            <Label htmlFor="first_name_ar">الاسم الأول (عربي)</Label>
            <Input id="first_name_ar" {...register("first_name_ar")} />
          </div>

          {/* Last Name (Arabic) */}
          <div className="space-y-2">
            <Label htmlFor="last_name_ar">اسم العائلة (عربي)</Label>
            <Input id="last_name_ar" {...register("last_name_ar")} />
          </div>

          {/* Full Name (English) */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="full_name_en">الاسم الكامل (إنجليزي)</Label>
            <Input id="full_name_en" {...register("full_name_en")} />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              aria-invalid={errors.username ? true : undefined}
              {...register("username", { required: "اسم المستخدم مطلوب" })}
            />
            {errors.username && (
              <span className="text-red-500 text-sm">{errors.username.message}</span>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              aria-invalid={errors.email ? true : undefined}
              {...register("email", { required: "البريد الإلكتروني مطلوب" })}
            />
            {errors.email && (
              <span className="text-red-500 text-sm">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              aria-invalid={errors.password ? true : undefined}
              {...register("password", {
                required: "كلمة المرور مطلوبة",
                minLength: {
                  value: 8,
                  message: "كلمة المرور يجب ألا تقل عن 8 أحرف",
                },
                pattern: {
                  value: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
                  message: "يجب أن تحتوي كلمة المرور على أحرف وأرقام",
                },
              })}
            />
            {errors.password && (
              <span className="text-red-500 text-sm">{errors.password.message}</span>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="role_id">دور الأدمن</Label>
            <select
              id="role_id"
              className="border rounded-md p-2 w-full"
              {...register("role_id", { required: "يجب اختيار دور الأدمن" })}
            >
              <option value="">اختر الدور</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <span className="text-red-500 text-sm">{errors.role_id.message}</span>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <Button className="bg-primary" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
