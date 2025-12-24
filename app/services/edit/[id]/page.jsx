"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Loader from "@/components/ui/Loader";
import PageTitle from "@/components/ui/page-title";
import { Button } from "@/components/ui/button";
import fetchWithAuth from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import BackLink from "@/components/ui/back-link";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export default function EditServicePage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params?.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [service, setService] = useState(null);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [attachments, setAttachments] = useState([]);

    const [form, setForm] = useState({
        description: "",
        buyer_instructions: "",
        price: "",
        delivery_time_days: "",
    });

    const [coverImage, setCoverImage] = useState(null);
    const [gallery, setGallery] = useState([]);

    useEffect(() => {
        if (!serviceId) return;

        const fetchService = async () => {
            try {
                const res = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/services/private/${serviceId}`
                );
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "فشل تحميل الخدمة");

                setService(json.data);
                setForm({
                    description: json.data.description || "",
                    buyer_instructions: json.data.buyer_instructions || "",
                    price: json.data.price || "",
                    delivery_time_days: json.data.delivery_time_days || "",
                });
                setSelectedSkills(
                    json.data.skills?.map((s) => ({ value: s, label: s })) || []
                );
                setAttachments(json.data.attachments || []);
            } catch (err) {
                router.replace("/my-services");
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [serviceId, router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const loadSkillSuggestions = async (inputValue) => {
        if (!inputValue) return [];
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/skills/suggestions?query=${encodeURIComponent(inputValue)}`
            );
            const json = await res.json();
            return json.data.map((skill) => ({
                value: skill.id,
                label: skill.name,
            }));
        } catch {
            return [];
        }
    };

    const handleDeleteAttachment = async (attachment) => {
        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/services/${serviceId}/attachments/${attachment.id}`,
                { method: "DELETE" }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "فشل حذف الملف");

            setAttachments((prev) => prev.filter((att) => att.id !== attachment.id));
            toast.success("تم حذف الملف بنجاح");
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء حذف الملف");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Update service
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/services/${serviceId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...form,
                        price: Number(form.price),
                        delivery_time_days: Number(form.delivery_time_days),
                        skills: selectedSkills.map((s) => s.label),
                    }),
                }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "فشل تحديث الخدمة");

            // Upload attachments
            if (coverImage || gallery.length > 0) {
                const formData = new FormData();
                const attachments_meta = [];

                if (coverImage instanceof File) {
                    formData.append("files", coverImage);
                    attachments_meta.push({
                        filename: coverImage.name,
                        file_type: "cover",
                    });
                }

                gallery.forEach((file) => {
                    if (file instanceof File) {
                        formData.append("files", file);
                        attachments_meta.push({
                            filename: file.name,
                            file_type: "gallery_image",
                        });
                    }
                });

                if (attachments_meta.length > 0) {
                    formData.append("attachments_meta", JSON.stringify(attachments_meta));

                    const uploadRes = await fetchWithAuth(
                        `${process.env.NEXT_PUBLIC_BASE_URL}/services/${serviceId}/attachments`,
                        { method: "POST", body: formData }
                    );

                    const uploadJson = await uploadRes.json();
                    if (!uploadRes.ok)
                        throw new Error(uploadJson.message || "فشل رفع الملفات");
                }
            }

            toast.success("تم تحديث الخدمة بنجاح");
            router.push(`/services/private/${serviceId}`);
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء التحديث");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 mt-6">

            <div className="mb-3">
                <BackLink href={`/services/private/${serviceId}`}>العودة للخدمة</BackLink>
            </div>
            <PageTitle title="تعديل الخدمة" />

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-6"
                dir="rtl"
            >
                {/* Title (read-only) */}
                <div className="flex flex-col">
                    <label className="mb-1 text-gray-700 font-bold">عنوان الخدمة</label>
                    <Input type="text" value={service?.title} disabled />
                </div>

                {/* Description */}
                <div className="flex flex-col">
                    <label className="mb-1 text-gray-700 font-bold">الوصف</label>
                    <Textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                    />
                </div>

                {/* Buyer instructions */}
                <div className="flex flex-col">
                    <label className="mb-1 text-gray-700 font-bold">
                        تعليمات للمشتري
                    </label>
                    <Textarea
                        name="buyer_instructions"
                        value={form.buyer_instructions}
                        onChange={handleChange}
                    />
                </div>

                {/* Price & Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-700 font-bold">السعر</label>
                        <Input
                            type="number"
                            name="price"
                            value={form.price}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-700 font-bold">
                            مدة التسليم (أيام)
                        </label>
                        <Input
                            type="number"
                            name="delivery_time_days"
                            value={form.delivery_time_days}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Skills */}
                <div className="flex flex-col">
                    <label className="mb-1 text-gray-700 font-bold">المهارات</label>
                    <AsyncSelect
                        isMulti
                        cacheOptions
                        defaultOptions
                        value={selectedSkills}
                        loadOptions={loadSkillSuggestions}
                        onChange={setSelectedSkills}
                        placeholder="اختر المهارات"
                        className="text-right"
                        classNamePrefix="select"
                        closeMenuOnSelect={false}
                    />
                </div>

                {/* Current Attachments */}
                {attachments.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <label className="text-xl font-semibold">المرفقات الحالية</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {attachments.map((att) => (
                                <div
                                    key={att.id}
                                    className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-20 h-20 flex-shrink-0">
                                            <Image
                                                src={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${att.file_url}`}
                                                alt="attachment preview"
                                                fill
                                                className="object-cover rounded-lg border"
                                            />
                                        </div>
                                        <span className="text-lg font-medium truncate max-w-[150px]">
                                            {att.file_url.split("/").pop()}
                                        </span>
                                    </div>
                                    {att.file_type !== "cover" && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteAttachment(att)}
                                        >
                                            <Trash2 className="w-5 h-5 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cover upload */}
                <div className="flex flex-col gap-2">
                    <label className="text-xl font-semibold">صورة الغلاف (جديدة)</label>
                    <label
                        htmlFor="cover_image"
                        className="flex flex-col items-center justify-center w-full h-36 border-2 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition border-gray-300"
                    >
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-lg text-gray-600">اضغط لرفع صورة جديدة</p>
                        <input
                            id="cover_image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCoverImage(e.target.files[0])}
                            className="hidden"
                        />
                    </label>
                    {coverImage && (
                        <div className="mt-4 flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 shadow-sm">
                            <span className="text-lg font-medium truncate">{coverImage.name}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setCoverImage(null)}
                            >
                                <X className="w-5 h-5 text-red-500" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Gallery Upload */}
                <div className="flex flex-col gap-2">
                    <label className="text-xl font-semibold">صور إضافية (جديدة)</label>
                    <label
                        htmlFor="gallery_images"
                        className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                    >
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-lg text-gray-600">اضغط لرفع صور جديدة</p>
                        <input
                            id="gallery_images"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setGallery(Array.from(e.target.files))}
                            className="hidden"
                        />
                    </label>

                    {gallery.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {gallery.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 shadow-sm"
                                >
                                    <span className="text-lg font-medium truncate">{file.name}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setGallery((prev) => prev.filter((_, i) => i !== idx))}
                                    >
                                        <X className="w-5 h-5 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Button type="submit" disabled={saving}>
                    {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </Button>
            </form>
        </div>
    );
}
