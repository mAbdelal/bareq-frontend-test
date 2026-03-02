"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/ui/Loader";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/starRating";
import PageTitle from "@/components/ui/page-title";
import { MyRequestsCard } from "@/components/ui/RequestCard";
import BackLink from "@/components/ui/back-link";
import { useUser } from "@/context/UserContext";
import fetchWithAuth from "@/lib/api";
import { translateAcademicStatus } from "@/lib/translations";

export const dynamic = "force-dynamic";


const getRequestStatusLabel = (status) => {
    switch (status) {
        case "open":
            return "مفتوح";
        case "in_progress":
            return "قيد التنفيذ";
        case "submitted":
            return "تم التسليم";
        case "disputed_by_provider":
            return "نزاع من قبل المنفذ";
        case "disputed_by_owner":
            return "نزاع من قبل صاحب الطلب";
        case "owner_rejected":
            return "مرفوض من صاحب الطلب";
        case "completed":
            return "مكتمل";
        default:
            return "غير معروف";
    }
};

const getRequestStatusColor = (status) => {
    switch (status) {
        case "open":
            return "bg-blue-100 text-blue-700";
        case "in_progress":
            return "bg-yellow-100 text-yellow-700";
        case "submitted":
            return "bg-purple-100 text-purple-700";
        case "disputed_by_provider":
        case "disputed_by_owner":
            return "bg-red-100 text-red-700";
        case "owner_rejected":
            return "bg-orange-100 text-orange-700";
        case "completed":
            return "bg-green-100 text-green-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
};


export default function MyRequestsPage() {
    const { state } = useUser();
    const [loading, setLoading] = useState(true);
    const [academic, setAcademic] = useState(null);
    const [requests, setRequests] = useState([]);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [fallbackLetter, setFallbackLetter] = useState("A");

    useEffect(() => {
        if (!state.user) return;

        const fetchData = async () => {
            try {
                // Fetch Academic Profile
                const academicRes = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/public/${state.user.id}/profile`
                );
                const academicJson = await academicRes.json();
                setAcademic(academicJson.data);

                if (academicJson.data.user?.avatar) {
                    const avatar = academicJson.data.user.avatar;

                    setAvatarUrl(
                        avatar.startsWith("http")
                            ? avatar
                            : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${avatar}`
                    );
                }

                if (academicJson.data.user?.first_name_ar)
                    setFallbackLetter(
                        academicJson.data.user.first_name_ar[0]
                    );

                // Fetch Requests
                const requestsRes = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/requests/my`
                );
                const requestsJson = await requestsRes.json();
                setRequests(requestsJson.data);
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
            {/* Back Button */}
            <div>
                <BackLink href="/home">العودة للرئيسية</BackLink>
            </div>

            <PageTitle title="طلباتي" />

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full h-fit lg:w-1/4 flex flex-col items-center gap-4 bg-white shadow-lg rounded-2xl p-6 relative border border-gray-100">
                    <div className="absolute -top-16">
                        <Avatar
                            url={avatarUrl}
                            fallbackLetter={fallbackLetter}
                            alt={academic.user?.full_name_en}
                            size={128}
                        />
                    </div>

                    <h4 className="font-bold text-lg mt-20 text-center">
                        {academic.user?.first_name_ar}{" "}
                        {academic.user?.last_name_ar}
                    </h4>

                    <div className="flex items-center gap-2 text-yellow-500">
                        <StarRating value={academic.rating || 0} />
                        <span className="text-sm">
                            ({academic.ratings_count || 0})
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                        {academic.skills?.map((skill, i) => (
                            <span
                                key={i}
                                className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-medium"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>

                    <div className="w-full text-sm space-y-2">
                        <p>
                            <span className="font-semibold">
                                الحالة الأكاديمية:
                            </span>{" "}
                            {translateAcademicStatus(
                                academic.academic_status
                            ) || "-"}
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
                            <span className="font-semibold">
                                سنة التخرج:
                            </span>{" "}
                            {academic.study_end_year || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">
                                المسمى الوظيفي:
                            </span>{" "}
                            {academic.job_title || "-"}
                        </p>
                    </div>
                </div>

                {/* Requests Section */}
                <div className="w-full lg:w-3/4 flex flex-col gap-6">
                    {requests.length === 0 ? (
                        <p className="text-lg text-center mt-20">
                            لا توجد طلبات بعد
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {requests.map((request) => (
                                <div key={request.id} className="relative">
                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3 z-10">
                                        <span
                                            className={`px-3 py-1 text-xs font-semibold rounded-full ${getRequestStatusColor(
                                                request.status
                                            )}`}
                                        >
                                            {getRequestStatusLabel(
                                                request.status
                                            )}
                                        </span>
                                    </div>

                                    <MyRequestsCard
                                        request={request}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}