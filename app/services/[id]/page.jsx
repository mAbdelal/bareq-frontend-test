"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Loader from "@/components/ui/Loader";
import PageTitle from "@/components/ui/page-title";
import StarRating from "@/components/ui/starRating";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"
import ServiceCard from "@/components/ui/ServiceCard";
import BackLink from "@/components/ui/back-link";
import { useUser } from "@/context/UserContext";
import { Send } from "lucide-react";
import fetchWithAuth from "@/lib/api";
import { toast } from "sonner";

export default function ServiceDetailsPage() {
    const { id } = useParams();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [similarServices, setSimilarServices] = useState([]);
    const [ratings, setRatings] = useState([]);
    const { state } = useUser();
    const router = useRouter();

    const buyer = state.user;

    useEffect(() => {
        async function fetchService() {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/services/${id}/public`);
                if (res.ok) {
                    const json = await res.json();
                    setService(json.data);
                    fetchSimilarServices(json.data);
                    fetchRatings();
                } else {
                    setService(null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchService();
    }, [id]);

    async function fetchSimilarServices(currentService) {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/services/${id}/public/similar`);
            if (res.ok) {
                const json = await res.json();
                const filtered = json.data.filter((s) => s.id !== currentService.id);
                setSimilarServices(filtered);
            }
        } catch (err) {
            console.error("Failed to fetch similar services:", err);
        }
    }

    async function fetchRatings() {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/services/${id}/ratings/public`);
            if (res.ok) {
                const json = await res.json();
                setRatings(json.data);
            }
        } catch (err) {
            console.error("Failed to fetch ratings:", err);
        }
    }

    if (loading || buyer === undefined)
        return (
            <div className="flex justify-center items-center py-20">
                <Loader />
            </div>
        );

    if (!service)
        return (
            <div className="text-center py-20 text-gray-500">الخدمة غير موجودة</div>
        );

    const avatarUrl = service.provider?.user?.avatar
        ? service.provider.user.avatar.startsWith("http")
            ? service.provider.user.avatar
            : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${service.provider.user.avatar}`
        : undefined;


    const fallbackLetter = service.provider?.user?.first_name_ar
        ? service.provider.user.first_name_ar.charAt(0)
        : "؟";

    const handlePurchase = async () => {
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/purchases`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ service_id: service.id })
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error("فشل إتمام عملية الشراء");
            } else {
                toast.success("تم الشراء بنجاح");
                router.push(`/purchases/${json.data.id}`);
            }

            setOpen(false);
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء الشراء");
        }
    };

    return (
        <div className="pb-10 pt-12 px-4 md:px-6">

            <div>
                <BackLink href="/services">العودة للخدمات</BackLink>
            </div>

            <PageTitle title={service.title} className="mt-4" />

            <div className="flex flex-col lg:flex-row gap-6 mt-20 relative">
                {/* Sidebar */}
                <aside className="w-full lg:w-1/4 flex flex-col items-center gap-4 bg-white shadow-lg rounded-2xl p-6 relative border border-gray-100">
                    {service.price > 0 && state.user !== null && (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary text-white w-full py-3 text-md rounded-xl shadow-md hover:bg-primary/80 transition">
                                    شراء الخدمة - {service.price} $
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-2xl shadow-lg">
                                <DialogHeader className="space-y-2">
                                    <DialogTitle className="text-xl font-bold text-center">
                                        تأكيد الشراء
                                    </DialogTitle>
                                    <DialogDescription className="text-center text-gray-600">
                                        هل أنت متأكد أنك تريد شراء هذه الخدمة؟
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="bg-gray-50 border rounded-xl p-4 my-3 shadow-sm">
                                    <h3 className="font-semibold text-lg text-label mb-1 line-clamp-1 text-center">
                                        {service.title}
                                    </h3>
                                    <div className="mt-3 text-center">
                                        <span className="text-2xl font-bold text-primary">
                                            {service.price} $
                                        </span>
                                    </div>
                                </div>
                                <DialogFooter className="flex gap-3 justify-end mt-4">
                                    <Button variant="outline" className="rounded-lg px-5" onClick={() => setOpen(false)}>إلغاء</Button>
                                    <Button className="bg-primary text-white rounded-lg px-5 shadow hover:bg-primary/80" onClick={handlePurchase}>تأكيد الشراء</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    <Link className="w-full"
                        href={
                            state.user === null
                                ? "/login"
                                : `/chats/negotiation?service_id=${service.id}&buyer_id=${buyer.id}&provider_id=${service.provider?.user_id}`
                        }
                    >
                        <Button
                            variant="default"
                            className="mb-4 flex items-center justify-center gap-2 bg-primary text-white w-full rounded-xl shadow-md hover:bg-primary/80 transition"
                        >
                            <Send className="w-5 h-5" />
                            تواصل مع البائع
                        </Button>
                    </Link>

                    <div className="w-full bg-white rounded-xl shadow p-4 mt-4 flex flex-col gap-3">
                        <div className="flex gap-2">
                            <span className="font-semibold">التقييم:</span>
                            <StarRating value={service.rating || 0} />
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold">السعر:</span>
                            <span>{service.price ? `${service.price} $` : "مجانية"}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold">مدة التسليم:</span>
                            <span>{service.delivery_time_days || "-"}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold">عدد المشترين السابقين:</span>
                            <span>{service.purchases_count || 0}</span>
                        </div>
                        <div>
                            <p>
                                <span className="font-semibold">التصنيف الرئيسي:</span>{" "}
                                {service.category?.name || "-"}
                            </p>
                        </div>
                        <div>
                            <p>
                                <span className="font-semibold">التصنيف الفرعي:</span>{" "}
                                {service.academicSubcategory?.name || "-"}
                            </p>
                        </div>
                    </div>

                    <div>
                        <Avatar url={avatarUrl} fallbackLetter={fallbackLetter} alt={service.provider?.user?.full_name_en} />
                    </div>
                    <h4 className="font-bold text-lg md:text-xl mt-2 text-center text-label">
                        {service.provider?.user?.first_name_ar} {service.provider?.user?.last_name_ar}
                    </h4>
                    <p className="text-sm text-gray-500 text-center">
                        {service.provider?.user?.full_name_en}
                    </p>
                </aside>

                {/* Main Content */}
                <div className="w-full lg:w-3/4 flex flex-col gap-6">
                    {/* Carousel */}
                    {service.attachments?.length ? (
                        <Carousel className="w-full relative" dir="ltr">
                            <CarouselContent>
                                {service.attachments.map((att, idx) => (
                                    <CarouselItem key={att.id}>
                                        <div className="relative w-full h-80 rounded-xl overflow-hidden shadow">
                                            <Image
                                                src={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${att.file_url}`}
                                                alt={`attachment-${idx}`}
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
                        <div className="w-full h-80 bg-gray-200 flex items-center justify-center rounded-xl">
                            لا توجد مرفقات
                        </div>
                    )}

                    {/* Service Description */}
                    <h2 className="text-2xl font-bold">عن الخدمة</h2>
                    <p className="text-label leading-relaxed">{service.description}</p>

                    {/* Ratings Section */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6">تقييمات الخدمة</h2>

                        {ratings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {ratings.map((r) => (
                                    <div
                                        key={r.id}
                                        className="bg-white p-4 rounded-xl shadow flex flex-col gap-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                url={
                                                    r.rater.user.avatar
                                                        ? r.rater.user.avatar.startsWith("http")
                                                            ? r.rater.user.avatar
                                                            : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${r.rater.user.avatar}`
                                                        : undefined
                                                }
                                                fallbackLetter={r.rater.user.first_name_ar?.charAt(0)?.toUpperCase() || "؟"}
                                                alt={r.rater.user.full_name_en || "Rater Avatar"}
                                            />

                                            <div>
                                                <h4 className="font-semibold text-label">
                                                    {r.rater.user.first_name_ar} {r.rater.user.last_name_ar}
                                                </h4>
                                                <p className="text-sm text-gray-500">{r.rater.user.full_name_en}</p>
                                            </div>
                                        </div>
                                        <StarRating value={r.rating} />
                                        {r.comment && (
                                            <p className="text-gray-700 text-sm mt-1">{r.comment}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">لا يوجد تقييمات</p>
                        )}
                    </div>

                    {/* Similar Services */}
                    {similarServices.length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-2xl font-bold mb-6">خدمات مشابهة</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {similarServices.map((s) => (
                                    <ServiceCard key={s.id} service={s} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}