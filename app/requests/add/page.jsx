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

export default function AddRequestPage() {
    const router = useRouter();
    const { state } = useUser();
    const [authChecking, setAuthChecking] = useState(true);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);

    const schema = yup.object().shape({
        title: yup.string().required("العنوان مطلوب"),
        academic_category_id: yup
            .number()
            .typeError("التصنيف الرئيسي مطلوب")
            .transform((val, orig) => (orig === "" ? null : val))
            .required("التصنيف الرئيسي مطلوب"),
        academic_subcategory_id: yup
            .number()
            .nullable()
            .transform((val, orig) => (orig === "" ? null : val)),
        description: yup.string().required("الوصف مطلوب"),
        skills: yup.array().min(1, "اختر مهارة واحدة على الأقل"),
        budget: yup
            .number()
            .typeError("الميزانية يجب أن تكون رقم")
            .positive("الميزانية يجب أن تكون أكبر من صفر")
            .required("الميزانية مطلوبة"),
        expected_delivery_days: yup
            .number()
            .typeError("مدة التسليم يجب أن تكون رقم")
            .positive("مدة التسليم يجب أن تكون أكبر من صفر")
            .required("مدة التسليم مطلوبة"),
        attachments: yup
            .mixed()
            .test(
                "fileSize",
                "يجب ألا يزيد حجم الملف عن 5 ميجابايت",
                (files) => (files ? Array.from(files).every((f) => f.size <= 5 * 1024 * 1024) : true)
            )
            .test(
                "fileType",
                "يجب أن تكون الملفات صور أو فيديوهات",
                (files) =>
                    files
                        ? Array.from(files).every((f) => f.type.startsWith("image") || f.type.startsWith("video"))
                        : true
            ),
    });

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
            budget: "",
            expected_delivery_days: "",
            attachments: [],
        },
    });

    const formDataAttachments = watch("attachments");
    const academicCategoryId = watch("academic_category_id");

    useEffect(() => {
        if (state.user === undefined) return;
        if (state.user === null) router.replace("/login");
        else setAuthChecking(false);
    }, [state.user, router]);

    useEffect(() => {
        if (!state.user) return;
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/academic-categories/public`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "فشل تحميل التصنيفات");
                setCategories(json.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCategories();
    }, [state.user]);

    useEffect(() => {
        if (!academicCategoryId) return setSubcategories([]);
        const fetchSubcategories = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/academic-subcategories/${academicCategoryId}/public`
                );
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "فشل تحميل التصنيفات الفرعية");
                setSubcategories(json.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSubcategories();
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

    // Form submit
    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const form = new FormData();

            // Transform academic ids and skills
            const payload = {
                ...data,
                academic_category_id: Number(data.academic_category_id),
                academic_subcategory_id:
                    data.academic_subcategory_id === null ? null : Number(data.academic_subcategory_id),
                skills: JSON.stringify(data.skills),
            };

            Object.entries(payload).forEach(([key, value]) => {
                if (key === "attachments") {
                    value.forEach((file) => form.append("files", file));
                } else {
                    form.append(key, value);
                }
            });

            // Build attachments_meta
            if (data.attachments && data.attachments.length > 0) {
                const attachments_meta = data.attachments.map((file) => ({
                    file_name: file.name,
                    file_type: file.type.startsWith("video")
                        ? "gallery_video"
                        : file.type.startsWith("image")
                            ? "gallery_image"
                            : "general",
                }));
                form.append("attachments_meta", JSON.stringify(attachments_meta));
            }

            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/requests`, {
                method: "POST",
                body: form,
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "فشل إنشاء الطلب");

            toast.success("تم نشر الطلب بنجاح");
            router.push("/my-requests");
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء إنشاء الطلب");
        } finally {
            setLoading(false);
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
            <PageTitle title="اضف طلب" />
            <div className="flex flex-col md:flex-row gap-8 mt-6">
                {/* Left Tips Panel */}
                <div className="w-full h-fit md:w-1/4 bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="font-bold text-xl text-label mb-4">نصائح لإضافة الطلب</h2>
                    <ul className="list-disc list-inside space-y-3 text-gray-600 text-base">
                        <li>اكتب عنوان واضح ومختصر.</li>
                        <li>اختر التصنيف الرئيسي والفرعي بعناية.</li>
                        <li>صف المشروع بشكل مفصل لتسهيل قبول العروض.</li>
                        <li>حدد المهارات المطلوبة إذا كانت مهمة.</li>
                        <li>حدد ميزانية واقعية ومدة تسليم مناسبة.</li>
                        <li>يمكنك إضافة مرفقات لتوضيح المشروع أكثر.</li>
                    </ul>
                </div>

                {/* Right Form Panel */}
                <div className="w-full md:w-3/4 bg-white rounded-2xl shadow-lg p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                        {/* Title */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold text-label">عنوان المشروع</label>
                            <input
                                type="text"
                                {...register("title")}
                                placeholder="مثال: تطوير تطبيق لإدارة المهام"
                                className="border rounded-xl px-4 py-3 w-full text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                            />
                            {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
                        </div>

                        {/* Category */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold text-label">التصنيف الرئيسي</label>
                            <select
                                {...register("academic_category_id")}
                                onChange={(e) =>
                                    setValue(
                                        "academic_category_id",
                                        e.target.value === "" ? null : Number(e.target.value)
                                    )
                                }
                            >
                                <option value="">اختر التصنيف الرئيسي</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.academic_category_id && (
                                <span className="text-red-500 text-sm">{errors.academic_category_id.message}</span>
                            )}
                        </div>

                        {/* Subcategory */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold text-label">التصنيف الفرعي</label>
                            <select
                                {...register("academic_subcategory_id")}
                                onChange={(e) =>
                                    setValue(
                                        "academic_subcategory_id",
                                        e.target.value === "" ? null : Number(e.target.value)
                                    )
                                }
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
                            <label className="text-xl font-semibold text-label">وصف المشروع</label>
                            <textarea
                                {...register("description")}
                                placeholder="اشرح تفاصيل المشروع بدقة..."
                                className="border rounded-xl px-4 py-3 w-full text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition min-h-[140px]"
                            />
                            {errors.description && (
                                <span className="text-red-500 text-sm">{errors.description.message}</span>
                            )}
                        </div>

                        {/* Skills */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold text-label">المهارات المطلوبة</label>
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
                                            field.onChange((selected || []).map((s) => s.label));
                                            setSelectedSkills(selected || []);
                                        }}
                                        value={selectedSkills}
                                        placeholder="ابحث واختر المهارات"
                                        className="text-right text-lg"
                                        classNamePrefix="select"
                                        noOptionsMessage={() => "لا يوجد نتائج"}
                                        closeMenuOnSelect={false}
                                    />
                                )}
                            />
                            {errors.skills && <span className="text-red-500 text-sm">{errors.skills.message}</span>}
                        </div>

                        {/* Budget */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold text-label"> الميزانية المتوقعة</label>
                            <input
                                type="number"
                                {...register("budget")}
                                placeholder="200"
                                className="border rounded-xl px-4 py-3 w-full text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                            />
                            {errors.budget && <span className="text-red-500 text-sm">{errors.budget.message}</span>}
                        </div>

                        {/* Delivery days */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold text-label"> مدة التسليم (أيام)</label>
                            <input
                                type="number"
                                {...register("expected_delivery_days")}
                                placeholder="7"
                                className="border rounded-xl px-4 py-3 w-full text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                            />
                            {errors.expected_delivery_days && (
                                <span className="text-red-500 text-sm">{errors.expected_delivery_days.message}</span>
                            )}
                        </div>

                        {/* Attachments */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xl font-semibold text-label"> المرفقات</label>
                            <label
                                htmlFor="attachments"
                                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                            >
                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-lg text-gray-600"> اضغط للرفع</p>
                                <input
                                    id="attachments"
                                    type="file"
                                    multiple
                                    {...register("attachments")}
                                    onChange={(e) => setValue("attachments", Array.from(e.target.files))}
                                    className="hidden"
                                />
                            </label>
                            {errors.attachments && (
                                <span className="text-red-500 text-sm">{errors.attachments.message}</span>
                            )}
                            {formDataAttachments.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {formDataAttachments.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 shadow-sm"
                                        >
                                            <span className="text-label text-lg font-medium truncate">{file.name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    setValue(
                                                        "attachments",
                                                        formDataAttachments.filter((_, i) => i !== index)
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

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl py-4 text-lg font-semibold"
                        >
                            {loading ? "جاري النشر..." : "نشر الطلب"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
