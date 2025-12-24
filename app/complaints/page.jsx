"use client";
import { useForm } from "react-hook-form";
import PageTitle from "@/components/ui/page-title";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PublicComplaintsPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        // Common alternative keys some backends expect
        title: data.subject,
        content: data.message,
      };
      const res = await fetch(`/api/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "تعذر إرسال الشكوى، حاول لاحقًا");
      }
      toast.success("تم إرسال الشكوى بنجاح، سيتم مراجعتها قريبًا");
      reset();
    } catch (err) {
      toast.error(err.message || "حدث خطأ غير متوقع");
    }
  };

  return (
    <div className="py-6">
      <PageTitle title="الشكاوى" paragraph="يمكنك إرسال شكوى وسيقوم فريق الدعم بمراجعتها" />

      <div className="bg-white rounded-2xl shadow p-6 max-w-2xl mx-auto">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">الاسم</Label>
            <Input id="name" placeholder="اسمك الكامل" aria-invalid={errors.name ? true : undefined} {...register("name", { required: "مطلوب" })} />
            {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" placeholder="example@email.com" aria-invalid={errors.email ? true : undefined} {...register("email", { required: "مطلوب" })} />
            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">عنوان الشكوى</Label>
            <Input id="subject" placeholder="عنوان موجز" aria-invalid={errors.subject ? true : undefined} {...register("subject", { required: "مطلوب" })} />
            {errors.subject && <span className="text-red-500 text-sm">{errors.subject.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">نص الشكوى</Label>
            <Textarea id="message" rows={6} placeholder="أكتب تفاصيل الشكوى هنا" aria-invalid={errors.message ? true : undefined} {...register("message", { required: "مطلوب" })} />
            {errors.message && <span className="text-red-500 text-sm">{errors.message.message}</span>}
          </div>

          <Button type="submit" className="bg-primary" disabled={isSubmitting}>
            {isSubmitting ? "جاري الإرسال..." : "إرسال الشكوى"}
          </Button>
        </form>
      </div>
    </div>
  );
}
