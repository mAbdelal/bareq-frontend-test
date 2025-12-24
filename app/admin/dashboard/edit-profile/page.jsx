"use client";

export const dynamic = 'force-dynamic';

import { useForm } from "react-hook-form";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/ui/Avatar"; // import your Avatar component
import fetchWithAuth from "@/lib/api";

export default function AdminEditProfilePage() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [usernameForFallback, setUsernameForFallback] = useState('A');
  const [adminId, setAdminId] = useState(null);

  // Fetch current admin profile
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/admins/me/profile`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || 'تعذر تحميل البيانات');

        const admin = json?.data;
        reset({
          username: admin.user.username || '',
          first_name_ar: admin.user.first_name_ar || '',
          last_name_ar: admin.user.last_name_ar || '',
          full_name_en: admin.user.full_name_en || '',
          role: admin.role?.name || '',
        });
        setAvatarUrl(admin.user.avatar || '');
        setUsernameForFallback(admin.user.first_name_ar?.charAt(0) || 'U');
        setAdminId(admin.user_id);
        console.log({ admin })
      } catch (e) {
        toast.error(e.message || 'حدث خطأ في التحميل');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [reset]);

  // Submit updated admin profile
  const onSubmit = async (data) => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/me/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          first_name_ar: data.first_name_ar,
          last_name_ar: data.last_name_ar,
          full_name_en: data.full_name_en,
        })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || 'تعذر الحفظ');
      toast.success('تم حفظ البيانات');
    } catch (e) {
      toast.error(e.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  // Handle avatar upload
  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('avatar', file);

    try {
      setUploading(true);
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/admins/${adminId}/avatar`, {
        method: 'POST',
        body: form
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || 'تعذر رفع الصورة');
      setAvatarUrl(json.data.url);
      toast.success('تم رفع الصورة');
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="تعديل بيانات الأدمن" description="قم بتحديث معلومات الملف الشخصي" />

      <div className="bg-white rounded-xl shadow p-6 max-w-xl">
        {loading ? (
          <div className="text-center text-gray-500">جاري التحميل...</div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex items-center gap-4">
              <Avatar url={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${avatarUrl}`} fallbackLetter={usernameForFallback} size={80} />

              <div>
                <Label htmlFor="avatar">صورة الملف</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={onAvatarChange} disabled={uploading} />
                {uploading && <div className="text-sm text-gray-500 mt-1">جاري الرفع...</div>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input id="username" {...register("username")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_name_ar">الاسم الأول (عربي)</Label>
              <Input id="first_name_ar" {...register("first_name_ar")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name_ar">اسم العائلة (عربي)</Label>
              <Input id="last_name_ar" {...register("last_name_ar")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name_en">الاسم الكامل (إنجليزي)</Label>
              <Input id="full_name_en" {...register("full_name_en")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">الدور</Label>
              <Input id="role" disabled {...register("role")} />
            </div>

            <Button className="bg-primary" disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ'}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
