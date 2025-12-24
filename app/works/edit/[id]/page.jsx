"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import fetchWithAuth from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Upload, X, Trash2 } from "lucide-react";
import PageTitle from "@/components/ui/page-title";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Image from "next/image";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import BackLink from "@/components/ui/back-link";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

const schema = yup.object().shape({
    title: yup.string().required("عنوان العمل مطلوب"),
    academic_category_id: yup.string().required("اختر التصنيف الرئيسي"),
    academic_subcategory_id: yup.string().nullable(),
    description: yup.string().required("تفاصيل العمل مطلوبة"),
    skills: yup.array().min(1, "اختر مهارة واحدة على الأقل"),
    achievement_date: yup
        .date()
        .required("اختر تاريخ الإنجاز")
        .typeError("تاريخ غير صالح"),
});

export default function EditWorkPage() {
    const router = useRouter();
    const { id } = useParams();
    const { state } = useUser();

    const [authChecking, setAuthChecking] = useState(true);
    const [loadingWork, setLoadingWork] = useState(true);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [attachments, setAttachments] = useState([]);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            title: "",
            academic_category_id: "",
            academic_subcategory_id: "",
            description: "",
            skills: [],
            cover_image: null,
            gallery: [],
            achievement_date: "",
        },
    });

    const watchCover = watch("cover_image");
    const watchGallery = watch("gallery");
    const watchCategoryId = watch("academic_category_id");

    // Auth check
    useEffect(() => {
        if (state.user === undefined) return;
        if (state.user === null) router.replace("/login");
        else setAuthChecking(false);
    }, [state.user, router]);

    // Load categories
    useEffect(() => {
        if (!state.user) return;
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/academic-categories/public`)
            .then((res) => res.json())
            .then((json) => setCategories(json.data))
            .catch(console.error);
    }, [state.user]);

    // Load subcategories
    useEffect(() => {
        if (!watchCategoryId) return setSubcategories([]);
        fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/academic-subcategories/${watchCategoryId}/public`
        )
            .then((res) => res.json())
            .then((json) => setSubcategories(json.data))
            .catch(console.error);
    }, [watchCategoryId]);

    // Load existing work data
    useEffect(() => {
        if (!id) return;
        const fetchWork = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/works/${id}`,
                    { method: "GET" }
                );
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "فشل تحميل العمل");

                const work = json.data;

                reset({
                    title: work.title,
                    academic_category_id: String(work.category_id || ""),
                    academic_subcategory_id: String(work.subcategory_id || ""),
                    description: work.description,
                    skills: work.skills.map((s) => ({ label: s, value: s })),
                    achievement_date: work.achievement_date
                        ? work.achievement_date.split("T")[0]
                        : "",
                });

                setSelectedSkills(work.skills.map((s) => ({ label: s, value: s })));
                setAttachments(work.attachments || []);
            } catch (err) {
                toast.error(err.message || "حدث خطأ أثناء تحميل البيانات");
            } finally {
                setLoadingWork(false);
            }
        };
        fetchWork();
    }, [id, reset]);

    const loadSkillSuggestions = async (inputValue) => {
        if (!inputValue) return [];
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/skills/suggestions?query=${encodeURIComponent(
                    inputValue
                )}`
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
            // If cover
            if (attachment.file_type === "cover") {
                if (!watchCover) {
                    toast.error("يجب رفع صورة غلاف جديدة قبل حذف القديمة");
                    return;
                }

                const formData = new FormData();
                formData.append("files", watchCover);
                formData.append(
                    "attachments_meta",
                    JSON.stringify([{ filename: watchCover.name, file_type: "cover" }])
                );

                const uploadRes = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/works/${id}/attachments`,
                    { method: "POST", body: formData }
                );

                const uploadJson = await uploadRes.json();
                if (!uploadRes.ok)
                    throw new Error(uploadJson.message || "فشل استبدال صورة الغلاف");

                setAttachments((prev) =>
                    prev.filter((att) => att.file_type !== "cover").concat(uploadJson.data)
                );
                setValue("cover_image", null);
                toast.success("تم استبدال صورة الغلاف بنجاح");
                return;
            }

            // Gallery attachment
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/works/${id}/attachments/${attachment.id}`,
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

    const onSubmit = async (data) => {
        try {
            // Update work
            const updateRes = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/works/${id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: data.title,
                        description: data.description,
                        category_id: Number(data.academic_category_id),
                        subcategory_id: data.academic_subcategory_id
                            ? Number(data.academic_subcategory_id)
                            : null,
                        skills: data.skills.map((s) => s.label || s),
                        achievement_date: data.achievement_date,
                    }),
                }
            );

            const updateJson = await updateRes.json();
            if (!updateRes.ok) throw new Error(updateJson.message || "فشل تعديل العمل");

            // Upload attachments
            if (data.cover_image || (Array.isArray(data.gallery) && data.gallery.length > 0)) {
                const form = new FormData();
                const attachments_meta = [];

                if (data.cover_image instanceof File) {
                    form.append("files", data.cover_image);
                    attachments_meta.push({ filename: data.cover_image.name, file_type: "cover" });
                }

                if (Array.isArray(data.gallery)) {
                    data.gallery.forEach((file) => {
                        if (file instanceof File) {
                            form.append("files", file);
                            attachments_meta.push({ filename: file.name, file_type: "gallery_image" });
                        }
                    });
                }

                form.append("attachments_meta", JSON.stringify(attachments_meta));

                const uploadRes = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/works/${id}/attachments`,
                    { method: "POST", body: form }
                );

                const uploadJson = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadJson.message || "فشل رفع الملفات");
            }

            toast.success("تم تعديل العمل بنجاح");
            router.push("/my-works");
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء تعديل العمل");
        }
    };

    if (authChecking || loadingWork)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );

    return (
        <div className="min-h-screen p-8">
            <div className="mb-3">
                <BackLink href={`/works/${id}`}>العودة للعمل</BackLink>
            </div>

            <PageTitle title="تعديل العمل" />

            <div className="flex flex-col md:flex-row gap-8 mt-6">
                {/* Instructions Panel */}
                <div className="w-full h-fit md:w-1/4 bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="font-bold text-xl mb-4">تعليمات لتعديل عمل</h2>
                    <ul className="list-disc list-inside space-y-3 text-gray-600 text-base">
                        <li>يمكنك تعديل العنوان أو الوصف أو التصنيف أو المهارات.</li>
                        <li>يمكنك رفع صورة غلاف جديدة أو صور إضافية.</li>
                        <li>يمكنك حذف المرفقات الحالية أو إضافة أخرى جديدة.</li>
                        <li>تأكد من ملء جميع الحقول المطلوبة بشكل صحيح.</li>
                    </ul>
                </div>

                {/* Form Panel */}
                <div className="w-full md:w-3/4 bg-white rounded-2xl shadow-lg p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                        {/* Title */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">عنوان العمل</label>
                            <input
                                {...register("title")}
                                placeholder="عنوان العمل"
                                className="border rounded-xl px-4 py-3 w-full text-lg"
                            />
                            {errors.title && (
                                <p className="text-red-500 text-sm">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Category */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">التصنيف الرئيسي</label>
                            <select
                                {...register("academic_category_id")}
                                className="border rounded-xl px-4 py-3 w-full text-lg"
                            >
                                <option value="">اختر التصنيف الرئيسي</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.academic_category_id && (
                                <p className="text-red-500 text-sm">{errors.academic_category_id.message}</p>
                            )}
                        </div>

                        {/* Subcategory */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">التصنيف الفرعي</label>
                            <select
                                {...register("academic_subcategory_id")}
                                className="border rounded-xl px-4 py-3 w-full text-lg"
                                disabled={!subcategories.length}
                            >
                                <option value="">اختر التصنيف الفرعي</option>
                                {subcategories.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Achievement Date */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">تاريخ الإنجاز</label>
                            <input
                                type="date"
                                {...register("achievement_date")}
                                className="border rounded-xl px-4 py-3 w-full text-lg"
                            />
                            {errors.achievement_date && (
                                <p className="text-red-500 text-sm">{errors.achievement_date.message}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">تفاصيل العمل</label>
                            <textarea
                                {...register("description")}
                                placeholder="اشرح تفاصيل العمل..."
                                className="border rounded-xl px-4 py-3 w-full text-lg min-h-[120px]"
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm">{errors.description.message}</p>
                            )}
                        </div>

                        {/* Skills */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">المهارات</label>
                            <Controller
                                control={control}
                                name="skills"
                                render={({ field }) => (
                                    <AsyncSelect
                                        instanceId="skills-async-select"
                                        isMulti
                                        cacheOptions
                                        defaultOptions
                                        loadOptions={loadSkillSuggestions}
                                        onChange={(selected) => {
                                            field.onChange(selected || []);
                                            setSelectedSkills(selected || []);
                                        }}
                                        value={selectedSkills}
                                        placeholder="ابحث واختر المهارات"
                                        className="text-right text-lg"
                                    />
                                )}
                            />
                            {errors.skills && (
                                <p className="text-red-500 text-sm">{errors.skills.message}</p>
                            )}
                        </div>

                        {/* Existing Attachments */}
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

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="hover:bg-red-50 transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5 text-red-500" />
                                                    </Button>
                                                </AlertDialogTrigger>

                                                <AlertDialogContent
                                                    dir="rtl"
                                                    className="max-w-md mx-auto rounded-2xl p-6 bg-white shadow-2xl border border-red-200"
                                                >
                                                    <AlertDialogHeader className="text-right space-y-3">
                                                        <div className="flex items-center justify-start gap-2 text-red-600">
                                                            <Trash2 className="w-6 h-6" />
                                                            <AlertDialogTitle className="text-2xl font-bold">
                                                                تأكيد الحذف
                                                            </AlertDialogTitle>
                                                        </div>
                                                        <AlertDialogDescription className="text-gray-700 text-base leading-relaxed text-right">
                                                            هل أنت متأكد أنك تريد حذف هذا الملف؟{" "}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>

                                                    <AlertDialogFooter className="mt-6 flex flex-row-reverse gap-4">
                                                        <AlertDialogCancel className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition">
                                                            إلغاء
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteAttachment(att)}
                                                            className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                                                        >
                                                            حذف
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>


                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cover Image Upload */}
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
                                    onChange={(e) => setValue("cover_image", e.target.files[0])}
                                    className="hidden"
                                />
                            </label>
                            {watchCover && (
                                <div className="mt-4 flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 shadow-sm">
                                    <span className="text-lg font-medium truncate">{watchCover.name}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setValue("cover_image", null)}
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
                                    onChange={(e) => setValue("gallery", Array.from(e.target.files))}
                                    className="hidden"
                                />
                            </label>

                            {watchGallery?.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {watchGallery.map((file, index) => (
                                        <GalleryItem key={index} file={file} index={index} watchGallery={watchGallery} setValue={setValue} />
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full rounded-xl py-4 text-lg font-semibold">
                            تعديل العمل
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Separate component for gallery items
function GalleryItem({ file, index, watchGallery, setValue }) {
    const handleDelete = () => {
        setValue(
            "gallery",
            watchGallery.filter((f, i) => i !== index)
        );
        toast.success("تم حذف الملف من القائمة");
    };

    return (
        <div className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 shadow-sm relative">
            <span className="text-lg font-medium truncate">{file.name}</span>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="hover:bg-red-50 transition-all"
            >
                <Trash2 className="w-5 h-5 text-red-500" />
            </Button>
        </div>
    );
}
