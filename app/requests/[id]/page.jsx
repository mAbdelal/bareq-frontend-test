"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Loader from "@/components/ui/Loader";
import PageTitle from "@/components/ui/page-title";
import Avatar from "@/components/ui/Avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import OfferCard from "@/components/ui/OfferCard";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import MakeOfferDialog from "@/components/ui/MakeOfferDialog";
import BackLink from "@/components/ui/back-link";

export default function RequestDetailsPage() {
    const { id } = useParams();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState([]);
    const [authChecking, setAuthChecking] = useState(true);
    const { state } = useUser();
    const router = useRouter();

    const isLoadingAuth = state.user === undefined;

    useEffect(() => {
        if (!isLoadingAuth) setAuthChecking(false);
    }, [isLoadingAuth]);

    useEffect(() => {
        async function fetchRequest() {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/requests/${id}/public`);
                if (res.ok) {
                    const json = await res.json();
                    setRequest(json.data);
                    setOffers(json.data.offers || []);
                } else {
                    setRequest(null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchRequest();
    }, [id]);

    if (loading || authChecking) {
        return <div className="flex justify-center items-center py-20"><Loader /></div>;
    }
    if (!request) return <div className="text-center py-20 text-gray-500">الطلب غير موجود</div>;

    const requester = request.requester?.user;

    return (
        <div className="pb-10 pt-12 px-4 md:px-6">

            <div className="mb-4">
                <BackLink href="/requests">العودة للطلبات</BackLink>
            </div>
            <PageTitle title={request.title} />

            <div className="flex flex-col lg:flex-row gap-6 mt-10">
                {/* Sidebar */}
                <aside className="w-full lg:w-1/4 flex flex-col items-center gap-4 bg-white shadow-lg rounded-2xl p-6 border border-gray-100 h-fit">
                    {/* Requester Info */}
                    <Avatar
                        url={
                            requester?.avatar
                                ? requester.avatar.startsWith("http")
                                    ? requester.avatar
                                    : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${requester.avatar}`
                                : undefined
                        }
                        fallbackLetter={requester?.first_name_ar?.charAt(0)?.toUpperCase() || "؟"}
                        alt={requester?.full_name_en || "Requester Avatar"}
                        size={96}
                        className="shadow-md"
                    />

                    <h4 className="font-bold text-lg md:text-xl mt-2 text-center text-gray-800">
                        {requester?.first_name_ar} {requester?.last_name_ar}
                    </h4>
                    <p className="text-sm text-gray-500 text-center">{requester?.full_name_en}</p>

                    {/* Basic Request Info */}
                    <div className="w-full rounded-xl p-5 mt-4 flex flex-col gap-3 ">
                        <div className="flex justify-between">
                            <span className="font-semibold text-label">الميزانية:</span>
                            <span className="text-gray-800">{request.budget ? `$${request.budget}` : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-label">مدة التسليم:</span>
                            <span className="text-gray-800">{request.expected_delivery_days ? `${request.expected_delivery_days} أيام` : "-"}</span>
                        </div>
                        {request.category?.name && (
                            <div className="flex justify-between">
                                <span className="font-semibold text-label">التصنيف الرئيسي:</span>
                                <span className="text-gray-800">{request.category.name}</span>
                            </div>
                        )}
                        {request.subcategory?.name && (
                            <div className="flex justify-between">
                                <span className="font-semibold text-label">التصنيف الفرعي:</span>
                                <span className="text-gray-800">{request.subcategory.name}</span>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="w-full lg:w-3/4 flex flex-col gap-6">
                    {/* Attachments */}
                    {request.attachments?.length ? (
                        <Carousel className="w-full relative" dir="ltr">
                            <CarouselContent>
                                {request.attachments.map((att, idx) => (
                                    <CarouselItem key={att.id}>
                                        <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-md">
                                            <Image
                                                src={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${att.file_url}`}
                                                alt={att.file_name || `attachment-${idx}`}
                                                fill
                                                className="object-contain rounded-xl"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="absolute top-1/2 left-2 -translate-y-1/2 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow hover:bg-primary/80 z-10">&#8249;</CarouselPrevious>
                            <CarouselNext className="absolute top-1/2 right-2 -translate-y-1/2 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow hover:bg-primary/80 z-10">&#8250;</CarouselNext>
                        </Carousel>
                    ) : (
                        <div className="w-full h-80 bg-gray-200 flex items-center justify-center rounded-xl text-gray-500 font-medium">
                            لا توجد مرفقات
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="w-full bg-white rounded-2xl p-6 shadow-inner flex flex-col gap-6">
                        {/* Description */}
                        <h2 className="text-2xl font-bold border-b pb-2 mb-4">وصف الطلب</h2>
                        <p className="text-label leading-relaxed">{request.description}</p>

                        {/* Skills */}
                        {request.skills?.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold mb-2 border-b pb-1">المهارات المطلوبة</h3>
                                <div className="flex flex-wrap gap-2">
                                    {request.skills.map((skill, idx) => (
                                        <span key={idx} className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Offers */}
                        <div className="mt-12">
                            <h2 className="text-2xl font-bold mb-6 border-b pb-2">العروض</h2>

                            {(state.user === null || // not logged in → show button
                                (!offers.some((offer) => offer.provider_id === state.user?.id) &&
                                    state.user?.id !== request.requester.user_id) // logged in and hasn't offered
                            ) && (
                                    <MakeOfferDialog
                                        request={request}
                                        setRequest={setRequest}
                                        setOffers={setOffers}
                                        user={state.user}
                                        router={router}
                                    />
                                )}

                            {offers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                    {offers.map((offer) => (
                                        <OfferCard key={offer.id} offer={offer} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-4">لا توجد عروض</p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
