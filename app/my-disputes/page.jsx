"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/ui/Loader";
import Avatar from "@/components/ui/Avatar";
import PageTitle from "@/components/ui/page-title";
import BackLink from "@/components/ui/back-link";
import { useUser } from "@/context/UserContext";
import fetchWithAuth from "@/lib/api";
import Link from "next/link";
import { Clock, XCircle, CheckCircle } from "lucide-react";
import { translateAcademicStatus, translateDisputeStatus } from "@/lib/translations";

export const dynamic = 'force-dynamic';

export default function MyDisputesPage() {
    const { state } = useUser();
    const [loading, setLoading] = useState(true);
    const [academic, setAcademic] = useState(null);
    const [disputes, setDisputes] = useState([]);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [fallbackLetter, setFallbackLetter] = useState("A");

    useEffect(() => {
        if (!state.user) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch academic info
                const academicRes = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/public/${state.user.id}/profile`
                );
                const academicJson = await academicRes.json();
                setAcademic(academicJson.data);

                if (academicJson.data.user?.avatar) {
                    const avatar = academicJson.data.user.avatar;

                    const avatarUrl = avatar.startsWith("http")
                        ? avatar 
                        : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${avatar}`; 

                    setAvatarUrl(avatarUrl);
                }

                if (academicJson.data.user?.first_name_ar)
                    setFallbackLetter(academicJson.data.user.first_name_ar[0]);

                // Fetch my disputes
                const disputesRes = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/disputes/my`
                );
                const disputesJson = await disputesRes.json();
                setDisputes(disputesJson.data);
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

            <PageTitle title="نزاعاتي" />

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full h-fit lg:w-1/4 flex flex-col items-center gap-4 bg-white shadow-lg rounded-2xl p-6 relative border border-gray-100">
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

                    <div className="mt-4 w-full text-sm md:text-base space-y-2 text-label">
                        <p>
                            <span className="font-semibold">الحالة الأكاديمية:</span>{" "}
                            {translateAcademicStatus(academic.academic_status)}
                        </p>
                        <p>
                            <span className="font-semibold">الجامعة:</span>{" "}
                            {academic.university || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">الكلية:</span>{" "}
                            {academic.faculty || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">التخصص:</span>{" "}
                            {academic.major || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">سنة البدء:</span>{" "}
                            {academic.study_start_year || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">سنة التخرج:</span>{" "}
                            {academic.study_end_year || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">المسمى الوظيفي:</span>{" "}
                            {academic.job_title || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">اسم المستخدم:</span>{" "}
                            {academic.user?.username || "-"}
                        </p>
                    </div>


                </div>

                {/* Disputes Section */}
                <div className="w-full lg:w-3/4 flex flex-col gap-6">
                    {disputes.length === 0 ? (
                        <p className="text-label text-lg text-center mt-20">
                            لا توجد نزاعات بعد
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            {disputes.map((dispute) => (
                                <div
                                    key={dispute.id}
                                    className="flex flex-col justify-between p-4 bg-white shadow-md rounded-xl border border-gray-100"
                                >
                                    {/* Title & Type */}
                                    <div className="mb-2 text-right">
                                        <h4 className="font-semibold text-md">
                                            {dispute.title || "بدون عنوان"}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {dispute.servicePurchase ? "خدمة" : "طلب مخصص"}
                                        </p>
                                    </div>
                                    {/* Status */}
                                    <div className="mb-2 flex items-center gap-2 text-sm">
                                        <div
                                            className={`flex items-center gap-1 px-3 py-1 rounded-md
                                            ${dispute.status === "open"
                                                    ? "text-yellow-800 bg-yellow-100"
                                                    : dispute.status === "under_review"
                                                        ? "text-blue-800 bg-blue-100"
                                                        : dispute.status === "resolved"
                                                            ? "text-green-800 bg-green-100"
                                                            : dispute.status === "rejected"
                                                                ? "text-red-800 bg-red-100"
                                                                : "text-gray-800 bg-gray-100"
                                                }`}
                                        >
                                            {dispute.status === "open" && <Clock className="w-4 h-4" />}
                                            {dispute.status === "under_review" && <Clock className="w-4 h-4" />}
                                            {dispute.status === "resolved" && <CheckCircle className="w-4 h-4" />}
                                            {dispute.status === "rejected" && <XCircle className="w-4 h-4" />}
                                            <span>{translateDisputeStatus(dispute.status)}</span>
                                        </div>
                                    </div>


                                    {/* Other participant */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <Avatar
                                            url={
                                                dispute.otherParticipant?.avatar
                                                    ? dispute.otherParticipant.avatar.startsWith("http")
                                                        ? dispute.otherParticipant.avatar 
                                                        : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${dispute.otherParticipant.avatar}` // local asset
                                                    : undefined 
                                            }
                                            fallbackLetter={dispute.otherParticipant?.first_name_ar?.[0] || "U"}
                                            alt={dispute.otherParticipant?.first_name_ar || "User"}
                                            size={40}
                                        />

                                        <span className="text-sm font-medium text-label">
                                            {dispute.otherParticipant?.first_name_ar + " " + dispute.otherParticipant?.last_name_ar}
                                        </span>
                                    </div>

                                    {/* Link */}
                                    <Link
                                        href={dispute.servicePurchase?
                                            `/disputes/${dispute.id}`
                                            : `/disputes/${dispute.id}`
                                        }
                                        className="text-primary font-medium hover:underline text-sm mt-auto"
                                    >
                                        عرض التفاصيل
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
