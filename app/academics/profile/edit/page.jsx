"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/Avatar";
import { useUser } from "@/context/UserContext";
import fetchWithAuth from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useForm, Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "sonner";
import PageTitle from "@/components/ui/page-title";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

const academicStatusOptions = [
    { value: "high_school_graduate", label: "خريج ثانوي" },
    { value: "bachelor_student", label: "طالب بكالوريوس" },
    { value: "bachelor", label: "حاصل على بكالوريوس" },
    { value: "master_student", label: "طالب ماجستير" },
    { value: "master", label: "حاصل على ماجستير" },
    { value: "phd_candidate", label: "طالب دكتوراه" },
    { value: "phd", label: "حاصل على دكتوراه" },
    { value: "alumni", label: "خريج" },
    { value: "researcher", label: "باحث" },
    { value: "other", label: "أخرى" },
];

export default function EditProfilePage() {
    const router = useRouter();
    const { state } = useUser();
    const [user, setUser] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);
    const [activeTab, setActiveTab] = useState("personal");
    const [selectedSkills, setSelectedSkills] = useState([]);
    const currentYear = new Date().getFullYear();

    const schema = yup.object().shape({
        first_name_ar: yup.string().required("الاسم الأول بالعربي مطلوب"),
        last_name_ar: yup.string().required("الاسم الأخير بالعربي مطلوب"),
        full_name_en: yup.string().required("الاسم الكامل بالإنجليزية مطلوب"),
        username: yup.string().required("اسم المستخدم مطلوب"),
        university: yup.string().nullable(),
        faculty: yup.string().nullable(),
        major: yup.string().nullable(),
        job_title: yup.string().nullable(),
        study_start_year: yup
            .number()
            .typeError("سنة البدء يجب أن تكون رقم")
            .integer("سنة البدء يجب أن تكون عدد صحيح")
            .min(1940, "سنة البدء يجب أن تكون بين 1940 وحتى هذا العام")
            .max(currentYear, `سنة البدء يجب أن تكون بين 1940 وحتى ${currentYear}`)
            .nullable(),
        study_end_year: yup
            .number()
            .typeError("سنة التخرج يجب أن تكون رقم")
            .integer("سنة التخرج يجب أن تكون عدد صحيح")
            .min(1940, "سنة التخرج يجب أن تكون بين 1940 وحتى 10 سنوات بعد هذا العام")
            .max(currentYear + 10, `سنة التخرج يجب أن تكون بين 1940 وحتى ${currentYear + 10}`)
            .nullable(),
        academic_status: yup.string().oneOf(academicStatusOptions.map(o => o.value)).nullable(),
        about: yup.string().nullable(),
        skills: yup.array().min(0),
    });


    const { register, handleSubmit, setValue, control } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            first_name_ar: "",
            last_name_ar: "",
            full_name_en: "",
            username: "",
            university: "",
            faculty: "",
            major: "",
            job_title: "",
            study_start_year: "",
            study_end_year: "",
            academic_status: "",
            about: "",
            skills: [],
        },
    });

    useEffect(() => {
        if (state.user === undefined) return;
        if (state.user === null) router.replace("/login");
        else setAuthChecking(false);
    }, [state.user, router]);

    useEffect(() => {
        if (authChecking || !state.user) return;
        const fetchProfile = async () => {
            try {
                const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/me/profile`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "فشل تحميل البيانات");

                setUser(json.data);
                const u = json.data.user;

                setValue("first_name_ar", u.first_name_ar || "");
                setValue("last_name_ar", u.last_name_ar || "");
                setValue("full_name_en", u.full_name_en || "");
                setValue("username", u.username || "");
                setValue("university", json.data.university || "");
                setValue("faculty", json.data.faculty || "");
                setValue("major", json.data.major || "");
                setValue("job_title", json.data.job_title || "");
                setValue("study_start_year", json.data.study_start_year || "");
                setValue("study_end_year", json.data.study_end_year || "");
                setValue("academic_status", json.data.academic_status || "");
                setValue("about", json.data.about || "");
                setValue("skills", json.data.skills || []);
                setSelectedSkills(json.data.skills?.map(s => ({ value: s, label: s })) || []);
            } catch (err) {
                toast.error(err.message || "حدث خطأ أثناء تحميل البيانات");
                router.replace("/login");
            }
        };
        fetchProfile();
    }, [authChecking, state.user, setValue, router]);

    const loadSkillSuggestions = async (inputValue) => {
        if (!inputValue) return [];
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/skills/suggestions?query=${encodeURIComponent(inputValue)}`);
            const json = await res.json();
            return json.data.map(s => ({ value: s.name, label: s.name }));
        } catch {
            return [];
        }
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                skills: data.skills,
            };
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/${state.user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "فشل تحديث البيانات");
            toast.success("تم تحديث البيانات بنجاح");
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء تحديث البيانات");
        }
    };

    if (authChecking || !user) return <div className="flex items-center justify-center min-h-screen"><Loader /></div>;

    return (
        <div className="min-h-screen p-4 md:p-6 mt-6">
            <PageTitle title="تعديل الملف الشخصي"/>
            <div className="flex flex-col md:flex-row gap-6 mt-6">
                {/* Left Panel */}
                <div className="w-full md:w-1/4 flex flex-col gap-4">
                    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center gap-4">
                        <Avatar
                            url={user.user.avatar ? `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${user.user.avatar}` : null}
                            fallbackLetter={user.user.first_name_ar?.charAt(0) || "U"}
                            size={80}
                            className="border"
                        />
                        <h2 className="text-xl font-bold text-center">{user.user.first_name_ar} {user.user.last_name_ar}</h2>
                        <Link href="/academics/profile" className="text-primary underline hover:text-primary/80">الملف الشخصي</Link>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-full md:w-3/4 flex flex-col gap-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div dir="rtl">
                            <TabsList className="flex justify-end bg-gray-100 rounded-t-xl p-1 overflow-x-auto gap-1">
                                <TabsTrigger value="personal" className="px-5 py-2 rounded-xl hover:bg-primary/20 text-lg font-medium whitespace-nowrap">البيانات الشخصية</TabsTrigger>
                                <TabsTrigger value="academic" className="px-5 py-2 rounded-xl hover:bg-primary/20 text-lg font-medium whitespace-nowrap">البيانات الأكاديمية</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Personal Info */}
                        <TabsContent value="personal" className="p-6 bg-white rounded-2xl shadow-lg flex flex-col gap-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-gray-700 font-bold" dir="rtl">الاسم الأول بالعربي</label>
                                        <input {...register("first_name_ar")} placeholder="مثال: محمد" dir="rtl" className="border rounded-xl px-4 py-3 w-full" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-gray-700 font-bold" dir="rtl">الاسم الأخير بالعربي</label>
                                        <input {...register("last_name_ar")} placeholder="مثال: علي" dir="rtl" className="border rounded-xl px-4 py-3 w-full" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-gray-700 font-bold" dir="rtl">الاسم الكامل بالإنجليزية</label>
                                        <input {...register("full_name_en")} placeholder="Example: Mohamed Ali" dir="ltr" className="border rounded-xl px-4 py-3 w-full" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-gray-700 font-bold" dir="rtl">اسم المستخدم</label>
                                        <input {...register("username")} placeholder="example_username" dir="ltr" className="border rounded-xl px-4 py-3 w-full" />
                                    </div>
                                </div>

                                <Button type="submit" className="mt-4 bg-primary text-white rounded-xl py-3">حفظ التغييرات</Button>
                            </form>
                        </TabsContent>

                        {/* Academic Info */}
                        <TabsContent value="academic" className="p-6 bg-white rounded-2xl shadow-lg flex flex-col gap-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                                {/* University, Faculty, Major, Job Title */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-gray-700 font-bold" dir="rtl">الجامعة</label>
                                        <input {...register("university")} placeholder="مثال: جامعة النجاح" dir="rtl" className="border rounded-xl px-4 py-3 w-full" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-gray-700 font-bold" dir="rtl">الكلية</label>
                                        <input {...register("faculty")} placeholder="مثال: كلية الهندسة" dir="rtl" className="border rounded-xl px-4 py-3 w-full" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-gray-700 font-bold" dir="rtl">التخصص</label>
                                        <input {...register("major")} placeholder="مثال: علوم الحاسوب" dir="rtl" className="border rounded-xl px-4 py-3 w-full" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-gray-700 font-bold" dir="rtl">المسمى الوظيفي</label>
                                        <input {...register("job_title")} placeholder="مثال: مطور برمجيات" dir="rtl" className="border rounded-xl px-4 py-3 w-full" />
                                    </div>
                                </div>

                                {/* Start & End Year */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-gray-700 font-bold" dir="rtl">سنة البدء</label>
                                        <input type="number" {...register("study_start_year")} placeholder="مثال: 2021" dir="ltr" min={1940} max={currentYear} className="border rounded-xl px-4 py-3 w-full" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-gray-700 font-bold" dir="rtl">سنة التخرج</label>
                                        <input type="number" {...register("study_end_year")} placeholder="مثال: 2025" dir="ltr" min={1940} max={currentYear + 10} className="border rounded-xl px-4 py-3 w-full" />
                                    </div>
                                </div>

                                {/* Academic Status */}
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">الحالة الأكاديمية</label>
                                    <select {...register("academic_status")} dir="rtl" className="border rounded-xl px-4 py-3 w-full">
                                        <option value="">اختر الحالة الأكاديمية</option>
                                        {academicStatusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </div>

                                {/* About */}
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">نبذة عنك</label>
                                    <textarea {...register("about")} placeholder="اكتب نبذة قصيرة عنك" dir="rtl" className="border rounded-xl px-4 py-3 w-full min-h-[120px]" />
                                </div>

                                {/* Skills */}
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">المهارات</label>
                                    <Controller
                                        control={control}
                                        name="skills"
                                        render={({ field }) => (
                                            <AsyncSelect
                                                isMulti
                                                cacheOptions
                                                defaultOptions
                                                loadOptions={loadSkillSuggestions}
                                                onChange={(selected) => { field.onChange((selected || []).map(s => s.label)); setSelectedSkills(selected || []); }}
                                                value={selectedSkills}
                                                placeholder="اختر المهارات"
                                                className="text-right"
                                                classNamePrefix="select"
                                                closeMenuOnSelect={false}
                                            />
                                        )}
                                    />
                                </div>

                                <Button type="submit" className="mt-4 bg-primary text-white rounded-xl py-3">حفظ التغييرات</Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
