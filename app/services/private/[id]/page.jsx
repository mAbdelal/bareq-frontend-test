"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import PageTitle from "@/components/ui/page-title";
import StarRating from "@/components/ui/starRating";
import Avatar from "@/components/ui/Avatar";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import fetchWithAuth from "@/lib/api";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/context/UserContext";
import { translateServicePurchaseStatus } from "@/lib/translations";
import { toast } from "sonner";
import BackLink from "@/components/ui/back-link";
import { Textarea } from "@/components/ui/textarea";


export default function PrivateServicePage() {
    const { id } = useParams();
    const router = useRouter();
    const [serviceData, setServiceData] = useState(null);
    const [disapprovalReason, setDisapprovalReason] = useState("");
    const [loading, setLoading] = useState(true);
    const { state } = useUser();

    // Dialog states
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [activateOpen, setActivateOpen] = useState(false);
    const [freezeOpen, setFreezeOpen] = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);

    // Fetch service data
    useEffect(() => {
        async function fetchService() {
            try {
                setLoading(true);
                const res = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/services/private/${id}`
                );
                const json = await res.json();
                if (res.ok) setServiceData(json.data);
                else setServiceData(null);
            } catch (err) {
                toast.error("حدث خطأ أثناء جلب بيانات الخدمة");
            } finally {
                setLoading(false);
            }
        }
        fetchService();
    }, [id]);

    // Handlers
    const handleActivate = async () => {
        if (!serviceData) return;
        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/services/${serviceData.id}/activate`,
                { method: "PATCH" }
            );

            if (res.ok) {
                setServiceData((prev) => ({ ...prev, is_active: true }));

                toast.success("تم تفعيل الخدمة بنجاح");
            } else {
                toast.error("فشل في تفعيل الخدمة");
            }
        } catch (err) {
            toast.error("حدث خطأ أثناء تفعيل الخدمة");
        } finally {
            setActivateOpen(false);
        }
    };

    const handleDelete = async () => {
        if (!serviceData) return;
        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/services/${serviceData.id}`,
                { method: "DELETE" }
            );

            if (res.ok) {
                setDeleteOpen(false);
                toast.success("تم حذف الخدمة بنجاح");
                router.push("/my-services");
            } else {
                toast.error(`فشل في حذف الخدمة`);
            }
        } catch (err) {
            toast.error("حدث خطأ أثناء حذف الخدمة");
        }
    };



    const handleFreeze = (loggedInUserRole) => async () => {
        if (!serviceData) return;

        try {
            // Decide which route to hit
            const endpoint =
                loggedInUserRole === "admin"
                    ? `${process.env.NEXT_PUBLIC_BASE_URL}/services/${serviceData.id}/toggle-admin-freeze`
                    : `${process.env.NEXT_PUBLIC_BASE_URL}/services/${serviceData.id}/toggle-owner-freeze`;

            const res = await fetchWithAuth(endpoint, { method: "PATCH" });

            if (res.ok) {
                setServiceData((prev) => ({
                    ...prev,
                    owner_frozen:
                        loggedInUserRole === "admin"
                            ? prev.owner_frozen
                            : !prev.owner_frozen,
                    admin_frozen:
                        loggedInUserRole === "admin"
                            ? !prev.admin_frozen
                            : prev.admin_frozen,
                }));

                setFreezeOpen(false);

                toast.success(
                    loggedInUserRole === "admin"
                        ? "تم تحديث حالة تجميد الخدمة بواسطة المشرف"
                        : "تم تحديث حالة تجميد الخدمة"
                );

            } else {
                toast.error("حدث خطأ ما");
            }
        } catch (err) {
            toast.error("حدث خطأ ما");
        }
    };

    const handleAdminDecision = (decision, reason = null) => async () => {
        if (!serviceData) return;

        // decision: "approved" أو "disapproved"
        if (decision === "disapproved" && !reason) {
            toast.error("يرجى إدخال سبب رفض الخدمة");
            return;
        }

        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/services/${serviceData.id}/admin-decision`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: decision,
                        disapproval_reason: reason
                    }),
                }
            );

            if (res.ok) {
                setServiceData((prev) => ({
                    ...prev,
                    admin_approval_status: decision,
                    admin_decision_at: new Date().toISOString(),
                    admin_disapproval_reason: decision === "disapproved" ? reason : null
                }));
                toast.success(
                    decision === "approved"
                        ? "تم اعتماد الخدمة بنجاح"
                        : "تم رفض الخدمة بنجاح"
                );
            } else {
                toast.error("فشل في تسجيل قرار الإدارة");
            }
        } catch (err) {
            toast.error("حدث خطأ أثناء تسجيل قرار الإدارة");
            console.error(err);
        } finally {
            setApproveOpen(false);
            setDisapprovalReason("");
        }
    };


    if (loading)
        return (
            <div className="flex justify-center items-center py-20">
                <Loader />
            </div>
        );

    if (!serviceData)
        return (
            <div className="text-center py-20 text-gray-500">الخدمة غير موجودة</div>
        );

    const avatar = serviceData?.provider?.user?.avatar;

    const avatarUrl = avatar
        ? avatar.startsWith("http")
            ? avatar
            : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${avatar}`
        : undefined;

    const fallbackLetter =
        serviceData.provider.user.first_name_ar?.charAt(0) || "؟";

    // Determine role
    let loggedInUserRole = null;
    let isAdmin = false;
    if (state.user) {
        if (state.user.id === serviceData.provider_id) loggedInUserRole = "owner";
        else if (state.user.role) {
            loggedInUserRole = "admin";
            isAdmin = true;
        } else router.push("/services");
    }

    return (
        <div className="pb-10 pt-12 px-4 md:px-6">

            <div className="mb-4">
                <BackLink href="/my-services">العودة لخدماتي</BackLink>
            </div>

            <PageTitle title={serviceData.title} />

            {loggedInUserRole && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 text-center text-xl">
                    أنت <span className="font-bold">{loggedInUserRole === "owner" ? "المالك" : "ادمن"}</span> لهذه الخدمة
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6 mt-20 relative">
                {/* Sidebar */}
                <aside className="w-full h-fit lg:w-1/4 flex flex-col items-center gap-6 bg-white shadow-xl rounded-2xl p-6 relative border border-gray-200">
                    {/* Avatar */}
                    <div className="absolute -top-16 lg:-top-16">
                        <Avatar
                            url={avatarUrl}
                            fallbackLetter={fallbackLetter}
                            alt={serviceData.provider.user.full_name_en}
                            size={128}
                        />
                    </div>

                    {/* Name & Job */}
                    <div className="mt-20 text-center">
                        <h4 className="font-bold text-lg md:text-xl text-label">
                            {serviceData.provider.user.first_name_ar} {serviceData.provider.user.last_name_ar}
                        </h4>
                        <p className="text-gray-500 mt-1">{serviceData.provider.job_title}</p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 text-yellow-500 mt-2">
                        <StarRating value={serviceData.provider.rating || 0} />
                        <span className="text-label text-sm">({serviceData.provider.ratings_count || 0})</span>
                    </div>

                    <hr className="w-full border-t border-gray-200 my-4" />
                    <div className="w-full text-center space-y-3">
                        {/* اعتماد الإدارة يظهر دائمًا */}
                        <p className="flex justify-center items-center gap-2">
                            <span className="font-semibold text-sm">اعتماد الإدارة:</span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${serviceData.admin_approval_status === "approved"
                                    ? "bg-primary/20 text-primary"
                                    : serviceData.admin_approval_status === "disapproved"
                                        ? "bg-red-100 text-red-600"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                            >
                                {serviceData.admin_approval_status === "approved"
                                    ? "معتمد"
                                    : serviceData.admin_approval_status === "disapproved"
                                        ? "مرفوض"
                                        : "قيد الانتظار"}
                            </span>
                        </p>

                        {serviceData.admin_approval_status === "approved" && (
                            <>
                                <p className="flex justify-center items-center gap-2">
                                    <span className="font-semibold text-sm">نشط:</span>
                                    <span
                                        className={`${serviceData.is_active ? "bg-primary/20 text-primary" : "bg-gray-200 text-gray-600"
                                            } px-2 py-0.5 rounded-full text-xs font-medium transition-colors`}
                                    >
                                        {serviceData.is_active ? "نعم" : "لا"}
                                    </span>
                                </p>

                                <p className="flex justify-center items-center gap-2">
                                    <span className="font-semibold text-sm">موقف المالك:</span>
                                    <span
                                        className={`${!serviceData.owner_frozen ? "bg-primary/20 text-primary" : "bg-gray-200 text-gray-600"
                                            } px-2 py-0.5 rounded-full text-xs font-medium transition-colors`}
                                    >
                                        {serviceData.owner_frozen ? "مجمّد" : "نشط"}
                                    </span>
                                </p>

                                <p className="flex justify-center items-center gap-2">
                                    <span className="font-semibold text-sm">موقف الإدارة:</span>
                                    <span
                                        className={`${!serviceData.admin_frozen ? "bg-primary/20 text-primary" : "bg-gray-200 text-gray-600"
                                            } px-2 py-0.5 rounded-full text-xs font-medium transition-colors`}
                                    >
                                        {serviceData.admin_frozen ? "مجمّد" : "نشط"}
                                    </span>
                                </p>
                            </>
                        )}
                    </div>






                    <hr className="w-full border-t border-gray-200 my-4" />

                    {/* Service Info */}
                    <div className="w-full text-center space-y-2 text-sm text-label">
                        <p>
                            <span className="font-semibold">السعر:</span>{" "}
                            <span className="text-primary">{serviceData.price} $</span>
                        </p>
                        <p>
                            <span className="font-semibold">مدة التسليم:</span> {serviceData.delivery_time_days} يوم
                        </p>
                        <p className="flex justify-center items-center gap-2">
                            <span className="font-semibold">تقييم الخدمة:</span>
                            <StarRating value={serviceData.rating || 0} />
                            <span className="text-xs text-gray-500">({serviceData.ratings_count || 0})</span>
                        </p>

                        {serviceData.skills?.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mt-1">
                                {serviceData.skills.map((skill, i) => (
                                    <span
                                        key={i}
                                        className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs md:text-sm font-medium hover:bg-primary/30 transition-colors"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                </aside>


                {/* Main Content */}
                <div className="w-full lg:w-3/4 flex flex-col gap-6">
                    {/* Carousel */}
                    {serviceData.attachments?.length ? (
                        <Carousel className="w-full relative" dir="ltr">
                            <CarouselContent>
                                {serviceData.attachments.map((att, idx) => (
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

                    {/* Buttons Row */}
                    <div className="flex gap-4 mt-4 flex-wrap">
                        {isAdmin ? (
                            <>
                                <AlertDialog open={freezeOpen} onOpenChange={setFreezeOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button className="flex-1 border border-gray-300">
                                            {serviceData.owner_frozen || serviceData.admin_frozen ? "رفع التجميد" : "تجميد الخدمة"}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="sm:max-w-lg">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>تأكيد التجميد</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                هل أنت متأكد أنك تريد {serviceData.owner_frozen || serviceData.admin_frozen ? "رفع التجميد" : "تجميد"} هذه الخدمة؟
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <Button variant="outline" onClick={() => setFreezeOpen(false)}>إلغاء</Button>
                                            <Button variant="destructive" onClick={handleFreeze(loggedInUserRole)}>
                                                {serviceData.owner_frozen || serviceData.admin_frozen ? "رفع التجميد" : "تجميد"}
                                            </Button>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                {!serviceData.is_active && (
                                    <AlertDialog open={activateOpen} onOpenChange={setActivateOpen}>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" className="flex-1 border border-gray-300">
                                                تفعيل الخدمة
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="sm:max-w-lg">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>تأكيد التفعيل</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    هل أنت متأكد أنك تريد تفعيل هذه الخدمة؟ سيتمكن المشترون من رؤيتها وشرائها.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <Button variant="outline" onClick={() => setActivateOpen(false)}>إلغاء</Button>
                                                <Button onClick={handleActivate}>تفعيل</Button>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                                {serviceData.admin_approval_status !== "approval" && (
                                    <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" className="flex-1 border border-gray-300">
                                                اعتماد الخدمة
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="sm:max-w-lg">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>تأكيد اعتماد الخدمة</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    هل أنت متأكد أنك تريد اتخاذ قرار هذه الخدمة؟ سيتمكن المشترون من رؤيتها وشرائها بعد الاعتماد.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>

                                            <div className="my-4">
                                                <Textarea
                                                    placeholder="اكتب السبب في حالة الرفض"
                                                    value={disapprovalReason}
                                                    onChange={(e) => setDisapprovalReason(e.target.value)}
                                                />
                                            </div>

                                            <AlertDialogFooter className="flex gap-2">
                                                <Button variant="outline" onClick={() => setApproveOpen(false)}>إلغاء</Button>
                                                <Button
                                                    onClick={() => handleAdminDecision("approved")}
                                                    className="bg-primary hover:bg-blue-400"
                                                >
                                                    اعتماد
                                                </Button>
                                                <Button
                                                    onClick={() => handleAdminDecision("disapproved", disapprovalReason)}
                                                    className="bg-red-600 hover:bg-red-400"
                                                >
                                                    رفض
                                                </Button>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                            </>
                        ) : (

                            <>
                                {/* Edit */}
                                <Button variant="default" className="flex-1" asChild>
                                    <Link href={`/services/edit/${serviceData.id}`}>تعديل الخدمة</Link>
                                </Button>

                                {/* Freeze */}
                                <AlertDialog open={freezeOpen} onOpenChange={setFreezeOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button className="flex-1 border border-gray-300">
                                            {serviceData.owner_frozen || serviceData.admin_frozen ? "رفع التجميد" : "تجميد الخدمة"}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="sm:max-w-lg">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>تأكيد التجميد</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                هل أنت متأكد أنك تريد {serviceData.owner_frozen || serviceData.admin_frozen ? "رفع التجميد" : "تجميد"} هذه الخدمة؟
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <Button variant="outline" onClick={() => setFreezeOpen(false)}>إلغاء</Button>
                                            <Button variant="destructive" onClick={handleFreeze(loggedInUserRole)}>
                                                {serviceData.owner_frozen || serviceData.admin_frozen ? "رفع التجميد" : "تجميد"}
                                            </Button>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                {/* Delete */}
                                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="flex-1">حذف الخدمة</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="sm:max-w-lg">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                هل أنت متأكد أنك تريد حذف هذه الخدمة؟ هذا الإجراء لا يمكن التراجع عنه.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <Button variant="outline" onClick={() => setDeleteOpen(false)}>إلغاء</Button>
                                            <Button variant="destructive" onClick={handleDelete}>حذف الخدمة</Button>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                    </div>


                    <div className="bg-gray-50 rounded-xl border border-gray-200 mt-4 p-4">
                        {/* Description */}
                        <p className="text-2xl font-bold">الوصف</p>
                        <h2 className="text-label leading-relaxed">{serviceData.description}</h2>

                        {/* Buyer Instructions */}
                        {serviceData.buyer_instructions && (
                            <div className="mt-4 p-4">
                                <p className="font-bold mb-1">تعليمات المشتري:</p>
                                <p className="text-label">{serviceData.buyer_instructions}</p>
                            </div>
                        )}

                    </div>

                    {/* Purchases */}
                    <PurchasesList serviceData={serviceData} setServiceData={setServiceData} isAdmin={isAdmin} router={router} />
                </div>
            </div>
        </div>
    );
}



function PurchasesList({ serviceData, setServiceData, isAdmin, router }) {

    const handleAcceptPurchase = async (purchaseId) => {
        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/purchases/${purchaseId}/accept`,
                { method: "PATCH" }
            );
            const json = await res.json();

            if (res.ok) {
                toast.success("تم قبول الشراء");
                router.push(`/purchases/${purchaseId}`)
            } else {
                toast.error(json.message);
            }
        } catch (err) {
            toast.error("حدث خطأ أثناء قبول الشراء");
        }
    };

    const handleRejectPurchase = async (purchaseId) => {
        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/purchases/${purchaseId}/reject`,
                { method: "PATCH" }
            );

            if (res.ok) {
                toast.success("تم رفض الشراء");
                setServiceData((prev) => ({
                    ...prev,
                    purchases: prev.purchases.map((p) =>
                        p.id === purchaseId ? { ...p, status: "provider_rejected" } : p
                    ),
                }));
            } else {
                toast.error("فشل في رفض الشراء");
            }
        } catch (err) {
            toast.error("حدث خطأ أثناء رفض الشراء");
        }
    };

    return (
        <>
            {serviceData.purchases?.length > 0 && (
                <div className="mt-6">
                    <p className="text-xl font-bold mb-4">المشتريات</p>
                    <div className="grid gap-4 md:grid-cols-2">
                        {serviceData.purchases.map((purchase) => {
                            const buyerAvatar = purchase?.buyer?.user?.avatar;

                            const buyerAvatarUrl = buyerAvatar
                                ? buyerAvatar.startsWith("http")
                                    ? buyerAvatar
                                    : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${buyerAvatar}`
                                : undefined;

                            const buyerFallback =
                                purchase.buyer?.user?.first_name_ar?.charAt(0) || "؟";

                            return (
                                <div
                                    key={purchase.id}
                                    className="bg-white shadow-md border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
                                >
                                    <Avatar
                                        url={buyerAvatarUrl}
                                        fallbackLetter={buyerFallback}
                                        alt={`${purchase.buyer?.user?.first_name_ar || ""} ${purchase.buyer?.user?.last_name_ar || ""}`}
                                        size={56}
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-label">
                                            {purchase.buyer?.user?.first_name_ar}{" "}
                                            {purchase.buyer?.user?.last_name_ar}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(purchase.created_at).toLocaleDateString("ar-EG")}
                                        </p>
                                        <span
                                            className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${purchase.status === "pending"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : purchase.status === "in_progress"
                                                    ? "bg-blue-100 text-primary"
                                                    : purchase.status === "completed"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {translateServicePurchaseStatus(purchase.status)}
                                        </span>

                                        {/* Action Buttons / Dialog */}
                                        <div className="mt-3 flex gap-2 justify-end">
                                            {purchase.status === "pending" && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="default" size="sm">
                                                            اتخاذ إجراء
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                هل تريد قبول أو رفض الشراء؟
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                إذا قبلت، سيبدأ العمل. إذا رفضت، سيتم إلغاء الشراء.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="flex gap-2">
                                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>

                                                            <AlertDialogAction
                                                                className="bg-primary hover:bg-blue-400"
                                                                onClick={() => handleAcceptPurchase(purchase.id)}
                                                            >
                                                                قبول
                                                            </AlertDialogAction>

                                                            <AlertDialogAction
                                                                className="bg-red-600 hover:bg-red-400"
                                                                onClick={() => handleRejectPurchase(purchase.id)}
                                                            >
                                                                رفض
                                                            </AlertDialogAction>

                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}


                                            {(purchase.status === "disputed_by_provider" ||
                                                purchase.status === "disputed_by_buyer") && (
                                                    <>
                                                        <Link href={`/purchases/${purchase.id}`}>
                                                            <Button variant="default" size="sm">
                                                                تفاصيل الشراء
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/dispute/${purchase.id}`}>
                                                            <Button variant="destructive" size="sm">
                                                                النزاع
                                                            </Button>
                                                        </Link>
                                                    </>
                                                )}

                                            {purchase.status !== "pending" &&
                                                purchase.status !== "provider_rejected" &&
                                                purchase.status !== "disputed_by_provider" &&
                                                purchase.status !== "disputed_by_buyer" && (
                                                    <Link href={`/purchases/${purchase.id}`}>
                                                        <Button variant="default" size="sm">
                                                            تفاصيل الشراء
                                                        </Button>
                                                    </Link>
                                                )}

                                            {!isAdmin && purchase.status !== "provider_rejected" && purchase.status !== "refused_due_to_timeout" && (
                                                <Link
                                                    href={{
                                                        pathname: "/chats/negotiation",
                                                        query: {
                                                            service_id: serviceData.id,
                                                            buyer_id: purchase.buyer_id,
                                                            provider_id: serviceData.provider_id,
                                                        },
                                                    }}
                                                >
                                                    <Button variant="outline" size="sm">
                                                        مراسلة
                                                    </Button>
                                                </Link>

                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
