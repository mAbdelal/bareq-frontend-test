"use client";
export const dynamic = 'force-dynamic';
import { useForm } from "react-hook-form";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ResolveComplaintPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const onSubmit = () => alert("تم حل الشكوى (تجريبي)");
  return (
    <div className="space-y-6">
      <AdminPageHeader title="حل الشكوى" description="أدخل رقم الشكوى والقرار المتخذ لإغلاقها" />
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="id">رقم الشكوى</Label>
            <Input id="id" aria-invalid={errors.id ? true : undefined} {...register("id", { required: "مطلوب" })} />
            {errors.id && <span className="text-red-500 text-sm">{errors.id.message}</span>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="decision">القرار</Label>
            <Textarea id="decision" rows={4} aria-invalid={errors.decision ? true : undefined} {...register("decision", { required: "مطلوب" })} />
            {errors.decision && <span className="text-red-500 text-sm">{errors.decision.message}</span>}
          </div>
          <Button className="bg-primary">تأكيد الحل</Button>
        </form>
      </div>
    </div>
  );
}
