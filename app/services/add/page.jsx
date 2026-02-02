"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import fetchWithAuth from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import PageTitle from "@/components/ui/page-title";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

const schema = yup.object().shape({
    title: yup.string().required("عنوان الخدمة مطلوب"),
    academic_category_id: yup.string().required("اختر التصنيف الرئيسي"),
    academic_subcategory_id: yup.string().nullable(),
    description: yup.string().required("وصف الخدمة مطلوب"),
    skills: yup.array().min(0),
    price: yup.number().typeError("السعر يجب أن يكون رقماً").required("السعر مطلوب").min(0),
    delivery_days: yup.number().typeError("مدة الإنجاز يجب أن تكون رقماً").required("مدة الإنجاز مطلوبة").min(1),
    cover_image: yup.mixed().required("صورة الغلاف مطلوبة"),
    gallery: yup.array(),
    deliverables: yup.string(),
    buyer_instructions: yup.string(),
});

export default function AddServicePage() {
    const router = useRouter();
    const { state } = useUser();
    const [authChecking, setAuthChecking] = useState(true);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            title: "",
            academic_category_id: "",
            academic_subcategory_id: "",
            description: "",
            skills: [],
            price: "",
            delivery_days: "",
            cover_image: null,
            gallery: [],
            deliverables: "",
            buyer_instructions: "",
        },
    });

    const watchCover = watch("cover_image");
    const watchGallery = watch("gallery");

    useEffect(() => {
        if (state.user === undefined) return;
        if (state.user === null) router.replace("/login");
        else setAuthChecking(false);
    }, [state.user, router]);

    useEffect(() => {
        if (!state.user) return;
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/academic-categories/public`)
            .then((res) => res.json())
            .then((json) => setCategories(json.data))
            .catch(console.error);
    }, [state.user]);

    // Load subcategories
    const academicCategoryId = watch("academic_category_id");
    useEffect(() => {
        if (!academicCategoryId) return setSubcategories([]);
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/academic-subcategories/${academicCategoryId}/public`)
            .then((res) => res.json())
            .then((json) => setSubcategories(json.data))
            .catch(console.error);
    }, [academicCategoryId]);

    const loadSkillSuggestions = async (inputValue) => {
        if (!inputValue) return [];
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/skills/suggestions?query=${encodeURIComponent(inputValue)}`
            );
            const json = await res.json();
            return json.data.map((skill) => ({ value: skill.id, label: skill.name }));
        } catch {
            return [];
        }
    };

    const onSubmit = async (data) => {
        try {
            // 1. Create service
            const serviceRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/services`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: data.title,
                    academic_category_id: Number(data.academic_category_id),
                    academic_subcategory_id: data.academic_subcategory_id
                        ? Number(data.academic_subcategory_id)
                        : null,
                    description: data.description,
                    buyer_instructions: data.buyer_instructions,
                    price: data.price,
                    delivery_time_days: data.delivery_days,
                    skills: data.skills.map((s) => s.label || s),
                }),
            });
            const serviceJson = await serviceRes.json();
            if (!serviceRes.ok) throw new Error(serviceJson.message || "فشل إضافة الخدمة");

            const serviceId = serviceJson.data.id;

            // 2. Upload attachments
            if (data.cover_image || data.gallery.length > 0) {
                const form = new FormData();
                const attachments_meta = [];

                if (data.cover_image) {
                    form.append("files", data.cover_image);
                    attachments_meta.push({ filename: data.cover_image.name, file_type: "cover" });
                }

                data.gallery.forEach((file) => {
                    form.append("files", file);
                    attachments_meta.push({ filename: file.name, file_type: "gallery_image" });
                });

                form.append("attachments_meta", JSON.stringify(attachments_meta));

                const uploadRes = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/services/${serviceId}/attachments`,
                    { method: "POST", body: form }
                );
                const uploadJson = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadJson.message || "فشل رفع الملفات");
            }

            toast.success("تم إضافة الخدمة بنجاح");
            router.push("/my-services");
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء إضافة الخدمة");
        }
    };

    if (authChecking)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );

    return (
        <div className="min-h-screen p-8">
            <PageTitle title="اضف خدمة" />
            <div className="flex flex-col md:flex-row gap-8 mt-6">
                {/* Left Tips Panel */}
                <div className="w-full md:w-1/4 bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="font-bold text-xl mb-4">نصائح لإضافة الخدمة</h2>
                    <ul className="list-disc list-inside space-y-3 text-gray-600 text-base">
                        <li>اكتب عنوان واضح وجذاب.</li>
                        <li>اختر التصنيف المناسب لخدمتك.</li>
                        <li>صف الخدمة بدقة لتقليل الاستفسارات.</li>
                        <li>ارفع صورة غلاف جذابة وصور توضيحية إضافية.</li>
                        <li>حدد مدة التسليم بدقة.</li>
                        <li>اذكر ما الذي سيتسلمه المشتري بوضوح.</li>
                        <li>ضع تعليمات للمشتري ليسهل التواصل.</li>
                    </ul>
                </div>

                {/* Right Form Panel */}
                <div className="w-full md:w-3/4 bg-white rounded-2xl shadow-lg p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                        {/* Title */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">عنوان الخدمة</label>
                            <input
                                {...register("title")}
                                placeholder="مثال: تصميم شعار احترافي"
                                className="border rounded-xl px-4 py-3 w-full text-lg"
                            />
                            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                        </div>

                        {/* Category */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">التصنيف الرئيسي</label>
                            <select {...register("academic_category_id")} className="border rounded-xl px-4 py-3 w-full text-lg">
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

                        {/* Description */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">وصف الخدمة</label>
                            <textarea
                                {...register("description")}
                                placeholder="اشرح تفاصيل الخدمة..."
                                className="border rounded-xl px-4 py-3 w-full text-lg min-h-[120px]"
                            />
                            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
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
                            {errors.skills && <p className="text-red-500 text-sm">{errors.skills.message}</p>}
                        </div>

                        {/* Delivery Days */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">مدة الإنجاز (أيام)</label>
                            <input {...register("delivery_days")} type="number" placeholder="7" className="border rounded-xl px-4 py-3 w-full text-lg" />
                            {errors.delivery_days && <p className="text-red-500 text-sm">{errors.delivery_days.message}</p>}
                        </div>

                        {/* Price */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">السعر ($)</label>
                            <input {...register("price")} type="number" placeholder="50" className="border rounded-xl px-4 py-3 w-full text-lg" />
                            {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                        </div>

                        {/* Deliverables */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">ماذا سوف تسلم</label>
                            <textarea {...register("deliverables")} placeholder="مثال: ملف الشعار بصيغة PNG و SVG" className="border rounded-xl px-4 py-3 w-full text-lg min-h-[100px]" />
                        </div>

                        {/* Buyer Instructions */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold">تعليمات للمشتري</label>
                            <textarea {...register("buyer_instructions")} placeholder="مثال: يرجى تزويدي باسم الشركة وألوان الهوية البصرية" className="border rounded-xl px-4 py-3 w-full text-lg min-h-[100px]" />
                        </div>

                        {/* Cover Image */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold text-label">صورة الغلاف</label>
                            <label
                                htmlFor="cover_image"
                                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                            >
                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-lg text-gray-600">اضغط لرفع صورة الغلاف</p>
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
                                    <span className="text-label text-lg font-medium truncate">{watchCover.name}</span>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setValue("cover_image", null)}>
                                        <X className="w-5 h-5 text-red-500" />
                                    </Button>
                                </div>
                            )}
                            {errors.cover_image && <p className="text-red-500 text-sm">{errors.cover_image.message}</p>}
                        </div>

                        {/* Gallery Images */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold text-label">صور إضافية للخدمة</label>
                            <label
                                htmlFor="gallery_images"
                                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                            >
                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-lg text-gray-600">اضغط لرفع الصور</p>
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
                                        <div key={index} className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 shadow-sm">
                                            <span className="text-label text-lg font-medium truncate">{file.name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    setValue(
                                                        "gallery",
                                                        watchGallery.filter((_, i) => i !== index)
                                                    )
                                                }
                                            >
                                                <X className="w-5 h-5 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full rounded-xl py-4 text-lg font-semibold">
                            اضافة الخدمة
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
