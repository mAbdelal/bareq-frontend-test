"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/ui/Loader";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/starRating";
import WorkCard from "@/components/ui/WorkCard";
import { useUser } from "@/context/UserContext";
import fetchWithAuth from "@/lib/api";
import PageTitle from "@/components/ui/page-title";
import { translateAcademicStatus } from "@/lib/translations";
import BackLink from "@/components/ui/back-link";

export const dynamic = 'force-dynamic';

export default function MyWorksPage() {
    const { state } = useUser();
    const [loading, setLoading] = useState(true);
    const [academic, setAcademic] = useState(null);
    const [works, setWorks] = useState([]);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [fallbackLetter, setFallbackLetter] = useState("A");

    useEffect(() => {
        if (!state.user) return;
        const fetchData = async () => {
            try {
                const academicRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/public/${state.user.id}/profile`);
                const academicJson = await academicRes.json();
                setAcademic(academicJson.data);
                console.log({ academicJson });

                if (academicJson.data.user?.avatar) {
                    const avatar = academicJson.data.user.avatar;

                    setAvatarUrl(
                        avatar.startsWith("http")
                            ? avatar
                            : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${avatar}`
                    );
                }

                if (academicJson.data.user?.first_name_ar) setFallbackLetter(academicJson.data.user.first_name_ar[0]);

                const worksRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/works/my`);
                const worksJson = await worksRes.json();
                setWorks(worksJson.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [state.user]);

    if (loading || !academic) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 flex flex-col gap-8">

            <div>
                <BackLink href="/home">العودة للرئيسية</BackLink>
            </div>
            <PageTitle title="أعمالي" />


            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full lg:w-1/4 flex flex-col items-center gap-4 bg-white shadow-lg rounded-2xl p-6 relative border border-gray-100">
                    <div className="absolute -top-16 lg:-top-16">
                        <Avatar
                            url={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${avatarUrl}`}
                            fallbackLetter={fallbackLetter}
                            alt={academic.user?.full_name_en}
                            size={128}
                        />
                    </div>

                    <h4 className="font-bold text-lg md:text-xl mt-20 text-center text-label">
                        {academic.user?.first_name_ar} {academic.user?.last_name_ar}
                    </h4>

                    <div className="flex items-center gap-2 text-yellow-500 mt-1">
                        <StarRating value={academic.rating || 0} />
                        <span className="text-label text-sm">
                            ({academic.ratings_count || 0})
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 justify-center">
                        {academic.skills?.map((skill, i) => (
                            <span
                                key={i}
                                className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs md:text-sm font-medium hover:bg-primary/30 transition-colors"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>

                    <div className="mt-4 w-full text-sm md:text-base space-y-2 text-label">
                        <p><span className="font-semibold">الحالة الأكاديمية:</span> {translateAcademicStatus(academic.academic_status)}</p>
                        <p><span className="font-semibold">الجامعة:</span> {academic.university || "-"}</p>
                        <p><span className="font-semibold">الكلية:</span> {academic.faculty || "-"}</p>
                        <p><span className="font-semibold">التخصص:</span> {academic.major || "-"}</p>
                        <p><span className="font-semibold">سنة البدء:</span> {academic.study_start_year || "-"}</p>
                        <p><span className="font-semibold">سنة التخرج:</span> {academic.study_end_year || "-"}</p>
                        <p><span className="font-semibold">المسمى الوظيفي:</span> {academic.job_title || "-"}</p>
                        <p><span className="font-semibold">اسم المستخدم:</span> {academic.user?.username || "-"}</p>
                        <p><span className="font-semibold">الاسم الإنجليزي:</span> {academic.user?.full_name_en || "-"}</p>
                    </div>
                </div>

                {/* Works Section */}
                <div className="w-full lg:w-3/4 flex flex-col gap-6">
                    {works.length === 0 ? (
                        <p className="text-label text-lg text-center mt-20">لا يوجد أعمال بعد</p>
                    ) : (
                        works.map((work) => <WorkCard key={work.id} work={work} />)
                    )}
                </div>
            </div>
        </div>
    );
}
