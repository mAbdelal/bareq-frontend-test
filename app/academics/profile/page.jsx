"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { useUser } from "@/context/UserContext";
import fetchWithAuth from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import PageTitle from "@/components/ui/page-title";
import { Briefcase, Layers, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

const academicStatusOptions = [
    { value: "high_school_student", label: "طالب ثانوي" },
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

export default function ViewProfilePage() {
    const router = useRouter();
    const { state } = useUser();
    const [user, setUser] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);
    const [activeTab, setActiveTab] = useState("personal");
    const [selectedSkills, setSelectedSkills] = useState([]);

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
                setSelectedSkills(json.data.skills?.map(s => ({ value: s, label: s })) || []);
            } catch (err) {
                router.replace("/login");
            }
        };

        fetchProfile();
    }, [authChecking, state.user]);

    if (authChecking || !user) {
        return <div className="flex items-center justify-center min-h-screen"><Loader /></div>;
    }

    const loadSkillSuggestions = async () => selectedSkills;

    return (
        <div className="min-h-screen p-4 md:p-6 mt-6">
            <PageTitle title="ملفك الشخصي" />

            <div className="flex flex-col md:flex-row gap-6 mt-6">
                <div className="w-full md:w-1/4 flex flex-col gap-4">
                    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center gap-4">
                        <Avatar
                            url={
                                user?.user?.avatar
                                    ? user.user.avatar.startsWith("http")
                                        ? user.user.avatar
                                        : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${user.user.avatar}`
                                    : null
                            }
                            fallbackLetter={user?.user?.first_name_ar?.charAt(0) || "U"}
                            size={80}
                            className="border"
                        />

                        <h2 className="text-xl font-bold text-center">{user.user.first_name_ar} {user.user.last_name_ar}</h2>
                        <Link href="/academics/profile/edit" className="text-primary underline hover:text-primary/80">تعديل الملف الشخصي</Link>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                        <Link href="/my-works">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <Briefcase size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    اعمالي
                                </span>
                            </Button>
                        </Link>

                        <Link href="/my-requests">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <Layers size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    طلباتي
                                </span>
                            </Button>
                        </Link>

                        <Link href="/my-services">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <Users size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    خدماتي
                                </span>
                            </Button>
                        </Link>

                        <Link href="/my-offers">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <HandCoins size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    عروضي
                                </span>
                            </Button>
                        </Link>

                        <Link href="/my-purchases">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <CreditCard size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    مشترياتي
                                </span>
                            </Button>
                        </Link>

                        <Link href="/my-disputes">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <Gavel size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    نزاعاتي
                                </span>
                            </Button>
                        </Link>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">الاسم الأول بالعربي</label>
                                    <input value={user.user.first_name_ar || ""} readOnly className="border rounded-xl px-4 py-3 w-full bg-gray-100" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">الاسم الأخير بالعربي</label>
                                    <input value={user.user.last_name_ar || ""} readOnly className="border rounded-xl px-4 py-3 w-full bg-gray-100" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">الاسم الكامل بالإنجليزية</label>
                                    <input value={user.user.full_name_en || ""} readOnly className="border rounded-xl px-4 py-3 w-full bg-gray-100" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">اسم المستخدم</label>
                                    <input value={user.user.username || ""} readOnly className="border rounded-xl px-4 py-3 w-full bg-gray-100" />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Academic Info */}
                        <TabsContent value="academic" className="p-6 bg-white rounded-2xl shadow-lg flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">الجامعة</label>
                                    <input value={user.university || ""} readOnly className="border rounded-xl px-4 py-3 w-full bg-gray-100" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">الكلية</label>
                                    <input value={user.faculty || ""} readOnly className="border rounded-xl px-4 py-3 w-full bg-gray-100" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">التخصص</label>
                                    <input value={user.major || ""} readOnly className="border rounded-xl px-4 py-3 w-full bg-gray-100" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">المسمى الوظيفي</label>
                                    <input value={user.job_title || ""} readOnly className="border rounded-xl px-4 py-3 w-full bg-gray-100" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">سنة البدء</label>
                                    <input value={user.study_start_year || ""} readOnly className="border rounded-xl px-4 py-3 w-full bg-gray-100" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 text-gray-700 font-bold" dir="rtl">سنة التخرج</label>
                                    <input value={user.study_end_year || ""} readOnly className="border rounded-xl px-4 py-3 w-full bg-gray-100" />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-gray-700 font-bold" dir="rtl">الحالة الأكاديمية</label>
                                <input value={academicStatusOptions.find(o => o.value === user.academic_status)?.label || ""} readOnly className="border rounded-xl px-4 py-3 w-full bg-gray-100" />
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-gray-700 font-bold" dir="rtl">نبذة عنك</label>
                                <textarea value={user.about || ""} readOnly className="border rounded-xl px-4 py-3 w-full min-h-[120px] bg-gray-100" />
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-gray-700 font-bold" dir="rtl">المهارات</label>
                                <AsyncSelect
                                    isMulti
                                    cacheOptions
                                    defaultOptions
                                    value={selectedSkills}
                                    loadOptions={loadSkillSuggestions}
                                    isDisabled
                                    placeholder="لا توجد مهارات"
                                    className="text-right"
                                    classNamePrefix="select"
                                    closeMenuOnSelect={false}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
