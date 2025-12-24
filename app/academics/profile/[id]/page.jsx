"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/ui/starRating";
import Loader from "@/components/ui/Loader";
import PageTitle from "@/components/ui/page-title";
import { translateAcademicStatus } from "@/lib/translations";
import WorkCard from "@/components/ui/WorkCard";
import { Send } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ServiceCard from "@/components/ui/ServiceCard";
import RatingCard from "@/components/ui/RatingCard";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";


export default function AcademicProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const { state } = useUser();
    const [academic, setAcademic] = useState(null);
    const [works, setWorks] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [worksLoading, setWorksLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [ratingsLoading, setRatingsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("bio");

    const handleContactClick = (e) => {
        e.preventDefault();
        // undefined = still checking, null = not logged in
        if (state.user === undefined) {
            // Still checking auth state, wait a moment
            return;
        }
        if (state.user === null) {
            // Not logged in, redirect to login
            router.push('/login');
            return;
        }
        // User is logged in, navigate to chat
        router.push(`/chats/general/${id}`);
    };

    useEffect(() => {
        async function fetchAcademic() {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/public/${id}/profile`);
                const json = await res.json();
                setAcademic(json.data || null);
            } catch (err) {
                toast.error("فشل التحميل");
            } finally {
                setLoading(false);
            }
        }
        fetchAcademic();
    }, [id]);

    useEffect(() => {
        if (activeTab !== "works" || works.length > 0) return;

        async function fetchWorks() {
            try {
                setWorksLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/works/public/user/${id}`);
                const json = await res.json();
                setWorks(json.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setWorksLoading(false);
            }
        }
        fetchWorks();
    }, [activeTab, id, works.length]);

    useEffect(() => {
        if (activeTab !== "services" || services.length > 0) return;

        async function fetchServices() {
            try {
                setServicesLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/services/user/${id}/public`, {
                    cache: "no-store",
                });
                const json = await res.json();
                setServices(json.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setServicesLoading(false);
            }
        }
        fetchServices();
    }, [activeTab, id, services.length]);

    useEffect(() => {
        if (activeTab !== "ratings" || ratings.length > 0) return;

        async function fetchRatings() {
            try {
                setRatingsLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/${id}/ratings/public`, {
                    cache: "no-store",
                });
                const json = await res.json();
                setRatings(json.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setRatingsLoading(false);
            }
        }
        fetchRatings();
    }, [activeTab, id, ratings.length]);

    if (loading)
        return (
            <div className="flex justify-center items-center py-20">
                <Loader />
            </div>
        );

    if (!academic)
        return (
            <div className="text-center py-20 text-gray-500">المستخدم غير موجود</div>
        );

    const avatarUrl = academic?.user?.avatar
        ? academic.user.avatar.startsWith("http")
            ? academic.user.avatar
            : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${academic.user.avatar}`
        : undefined;


    const fallbackLetter = academic.user?.first_name_ar
        ? academic.user.first_name_ar.charAt(0)
        : "؟";

    return (
        <div className="pb-10 pt-12 px-4 md:px-6">
            <PageTitle title="الملف الشخصي" />

            <div className="flex flex-col lg:flex-row gap-6 mt-20 relative">
                {/* Sidebar */}
                <div className="w-full lg:w-1/4 flex flex-col items-center gap-4 bg-white shadow-lg rounded-2xl p-6 relative border border-gray-100">
                    <div className="absolute -top-16 lg:-top-16">
                        <Avatar
                            url={avatarUrl}
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
                        <p>
                            <span className="font-semibold">الحالة الأكاديمية:</span>{" "}
                            {translateAcademicStatus(academic.academic_status)}
                        </p>
                        <p>
                            <span className="font-semibold">الجامعة:</span> {academic.university || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">الكلية:</span> {academic.faculty || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">التخصص:</span> {academic.major || "-"}
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
                            <span className="font-semibold">المسمى الوظيفي:</span> {academic.job_title || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">تاريخ الإنشاء:</span>{" "}
                            {new Date(academic.created_at).toLocaleDateString()}
                        </p>
                        <p>
                            <span className="font-semibold">اسم المستخدم:</span> {academic.user?.username || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">الاسم الإنجليزي:</span> {academic.user?.full_name_en || "-"}
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="w-full lg:w-3/4 flex flex-col gap-4 mt-6 lg:mt-0">
                    <Button
                        onClick={handleContactClick}
                        variant="default"
                        className="w-full h-12 mb-4 text-xl flex items-center justify-center gap-2"
                    >
                        <Send className="w-5 h-5" />
                        تواصل
                    </Button>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>


                        <div dir="rtl">
                            <TabsList className="flex justify-end bg-background rounded-t-xl p-1 overflow-x-auto">
                                <TabsTrigger
                                    value="bio"
                                    className="px-4 py-2 rounded-md hover:bg-primary/20 whitespace-nowrap"
                                >
                                    نبذة عني
                                </TabsTrigger>
                                <TabsTrigger
                                    value="works"
                                    className="px-4 py-2 rounded-md hover:bg-primary/20 whitespace-nowrap"
                                >
                                    الأعمال
                                </TabsTrigger>
                                <TabsTrigger
                                    value="services"
                                    className="px-4 py-2 rounded-md hover:bg-primary/20 whitespace-nowrap"
                                >
                                    الخدمات
                                </TabsTrigger>
                                <TabsTrigger
                                    value="ratings"
                                    className="px-4 py-2 rounded-md hover:bg-primary/20 whitespace-nowrap"
                                >
                                    التقييمات
                                </TabsTrigger>
                            </TabsList>

                        </div>

                        <div className="bg-white shadow-md rounded-b-xl p-4 md:p-6 mt-2">
                            <TabsContent value="bio" className="text-label text-right">
                                <p className="text-gray-500 text-center py-10">
                                    {academic.about || "لا توجد نبذة عن المستخدم."}
                                </p>
                            </TabsContent>

                            <TabsContent value="works" className="text-label text-right">
                                {worksLoading ? (
                                    <div className="flex justify-center py-20">
                                        <Loader />
                                    </div>
                                ) : works.length === 0 ? (
                                    <p className="text-gray-500 text-center py-10">
                                        لا توجد أعمال لعرضها
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
                                        {works.map((work) => (
                                            <WorkCard key={work.id} work={work} />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="services" className="text-label">
                                {servicesLoading ? (
                                    <div className="flex justify-center py-20">
                                        <Loader />
                                    </div>
                                ) : services.length === 0 ? (
                                    <p className="text-gray-500 text-center py-10">
                                        لا توجد خدمات لعرضها
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
                                        {services.map(service => (
                                            <ServiceCard key={service.id} service={service} />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="ratings" className="text-label">
                                {ratingsLoading ? (
                                    <div className="flex justify-center py-20">
                                        <Loader />
                                    </div>
                                ) : ratings.length === 0 ? (
                                    <p className="text-gray-500 text-center py-10">
                                        لا توجد تقييمات لعرضها
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
                                        {ratings.map(rating => (
                                            <RatingCard key={rating.id} rating={rating} />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}