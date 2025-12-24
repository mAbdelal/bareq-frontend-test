"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/ui/Loader";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/starRating";
import PageTitle from "@/components/ui/page-title";
import BackLink from "@/components/ui/back-link";
import { useUser } from "@/context/UserContext";
import fetchWithAuth from "@/lib/api";
import { translateAcademicStatus } from "@/lib/translations";
import { Clock, Calendar, XCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function MyPurchasesPage() {
    const { state } = useUser();
    const [loading, setLoading] = useState(true);
    const [purchases, setPurchases] = useState([]);
    const [academic, setAcademic] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [fallbackLetter, setFallbackLetter] = useState("A");

    useEffect(() => {
        if (!state.user) return;

        const fetchData = async () => {
            try {
                // Fetch academic info
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
                    setFallbackLetter(academicJson.data.user.first_name_ar[0]);

                const purchasesRes = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/purchases/my`
                );
                const purchasesJson = await purchasesRes.json();
                setPurchases(purchasesJson.data?.purchases || []);
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
        <div className="min-h-screen p-6 lg:p-10">
            {/* Back to Home Button */}
            <div className="mb-4">
                <BackLink href="/home">العودة للرئيسية</BackLink>
            </div>

            <PageTitle title="مشترياتي" />

            <div className="flex flex-col lg:flex-row gap-8 mt-24">
                {/* Profile Sidebar */}
                <div className="w-full lg:w-1/4 bg-white shadow-lg rounded-2xl p-6 border border-gray-100 flex flex-col items-center relative">
                    <div className="absolute -top-16">
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

                    {/* Rating */}
                    <div className="flex items-center gap-2 text-yellow-500 mt-2">
                        <StarRating value={academic.rating || 0} />
                        <span className="text-gray-600 text-sm">
                            ({academic.ratings_count || 0})
                        </span>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {academic.skills?.map((skill, i) => (
                            <span
                                key={i}
                                className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs md:text-sm font-medium"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>

                    {/* Academic Info */}
                    <div className="mt-6 w-full space-y-2 text-sm md:text-base text-label">
                        <InfoRow label="الحالة الأكاديمية" value={translateAcademicStatus(academic.academic_status)} />
                        <InfoRow label="الجامعة" value={academic.university} />
                        <InfoRow label="الكلية" value={academic.faculty} />
                        <InfoRow label="التخصص" value={academic.major} />
                        <InfoRow label="سنة البدء" value={academic.study_start_year} />
                        <InfoRow label="سنة التخرج" value={academic.study_end_year} />
                        <InfoRow label="المسمى الوظيفي" value={academic.job_title} />
                        <InfoRow label="اسم المستخدم" value={academic.user?.username} />
                        <InfoRow label="الاسم الإنجليزي" value={academic.user?.full_name_en} />
                    </div>
                </div>

                {/* Purchases Section */}
                <div className="w-full lg:w-3/4">
                    {purchases.length === 0 ? (
                        <p className="text-gray-600 text-lg text-center mt-20">
                            لا توجد مشتريات بعد
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {purchases.map((purchase) => (
                                <div
                                    key={purchase.id}
                                    className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-lg transition"
                                >
                                    {/* Service Title */}
                                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                                        {purchase.service?.title}
                                    </h3>

                                    {/* Provider Info */}
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            url={
                                                purchase.service?.provider?.user?.avatar
                                                    ? `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${purchase.service.provider.user.avatar}`
                                                    : ""
                                            }
                                            fallbackLetter={
                                                purchase.service?.provider?.user?.first_name_ar?.[0] ||
                                                "U"
                                            }
                                            alt={purchase.service?.provider?.user?.full_name_en}
                                            size={40}
                                        />
                                        <span className="text-sm text-gray-700">
                                            {purchase.service?.provider?.user?.first_name_ar}{" "}
                                            {purchase.service?.provider?.user?.last_name_ar}
                                        </span>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 text-yellow-500">
                                        <StarRating value={purchase.service?.rating || 0} />
                                        <span className="text-sm text-gray-600">
                                            ({purchase.service?.rating || 0})
                                        </span>
                                    </div>

                                    {/* Purchase Date */}
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            تم الشراء في{" "}
                                            {new Date(purchase.created_at).toLocaleDateString("ar-EG")}
                                        </span>
                                    </div>

                                    {(purchase.status === "pending" || purchase.status === "provider_rejected") && (
                                        <div className={`flex items-center gap-2 text-sm rounded-md px-3 py-1 w-max
    ${purchase.status === "pending" ? "text-yellow-800 bg-yellow-100" : "text-red-800 bg-red-100"}`}>

                                            {purchase.status === "pending" ? (
                                                <>
                                                    <Clock className="w-4 h-4" />
                                                    <span>بانتظار الموافقة من البائع</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-4 h-4" />
                                                    <span>تم رفض الطلب من قبل البائع</span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Link to Service */}
                                    <Link
                                        href={
                                            purchase.status === "pending"
                                                ? `/services/${purchase.service?.id}`
                                                : `/purchases/${purchase.id}`
                                        }
                                        className="text-primary font-medium mt-2 hover:underline text-sm self-start"
                                    >
                                        {purchase.status === "pending" ? "→ عرض تفاصيل الخدمة" : "→ عرض تفاصيل الشراء"}
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

function InfoRow({ label, value }) {
    return (
        <p className="flex items-center gap-2">
            <span className="font-semibold">{label}:</span>{" "}
            <span className="text-gray-700">{value || "-"}</span>
        </p>
    );
}
