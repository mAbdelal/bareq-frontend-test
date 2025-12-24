"use client";

export const dynamic = 'force-dynamic';

import { useForm } from "react-hook-form";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminChangePasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();

  const onSubmit = async (data) => {
    if (data.new?.length < 6) {
      toast.error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ oldPassword: data.current, newPassword: data.new })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || 'تعذر تغيير كلمة المرور');

      toast.success('تم تغيير كلمة المرور');
      reset({ current: '', new: '' });
    } catch (e) {
      toast.error(e.message || 'حدث خطأ');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="تغيير كلمة المرور"
        description="قم بتحديث كلمة المرور الخاصة بحساب الأدمن"
      />
      <div className="bg-white rounded-xl shadow p-6 max-w-xl">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="current">كلمة المرور الحالية</Label>
            <Input
              id="current"
              type="password"
              aria-invalid={errors.current ? true : undefined}
              {...register("current", { required: "مطلوب" })}
            />
            {errors.current && <span className="text-red-500 text-sm">{errors.current.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new">كلمة المرور الجديدة</Label>
            <Input
              id="new"
              type="password"
              aria-invalid={errors.new ? true : undefined}
              {...register("new", { required: "مطلوب" })}
            />
            {errors.new && <span className="text-red-500 text-sm">{errors.new.message}</span>}
          </div>

          <Button className="bg-primary" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </form>
      </div>
    </div>
  );
}
