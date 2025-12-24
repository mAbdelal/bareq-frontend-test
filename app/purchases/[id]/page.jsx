"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import PageTitle from "@/components/ui/page-title";
import Avatar from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageCircle, Upload, X } from "lucide-react";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import fetchWithAuth from "@/lib/api";
import BackLink from "@/components/ui/back-link";
import { translateServicePurchaseRole, translateServicePurchaseAction, translateServicePurchaseStatus } from "@/lib/translations";
import { useUser } from "@/context/UserContext";

export default function PurchaseDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { state } = useUser();

    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [finalDecisionLoading, setFinalDecisionLoading] = useState(false);
    const [commentModal, setCommentModal] = useState({ open: false, deliverableId: null, action: null, comment: "" });
    const [addDeliverableModal, setAddDeliverableModal] = useState({ open: false, message: "", files: [] });

    useEffect(() => {
        const fetchPurchase = async () => {
            try {
                setLoading(true);
                const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/purchases/${id}`);
                if (!res.ok) throw new Error("فشل تحميل الشراء");
                const json = await res.json();
                setPurchase(json.data);
            } catch (err) {
                toast.error(err.message);
                setPurchase(null);
            } finally {
                setLoading(false);
            }
        };
        fetchPurchase();
    }, [id]);

    // Deliverable accept/reject
    const handleDeliverableAction = async () => {
        if (!commentModal.deliverableId || !commentModal.action) return;
        try {
            const endpoint = commentModal.action === "accept" ? "accept" : "reject";
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/purchase-deliverables/${commentModal.deliverableId}/${endpoint}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ comment: commentModal.comment }),
                }
            );
            if (!res.ok) throw new Error(`فشل ${commentModal.action === "accept" ? "قبول" : "رفض"} التسليم`);
            toast.success(`تم ${commentModal.action === "accept" ? "قبول" : "رفض"} التسليم`);

            setPurchase(prev => ({
                ...prev,
                deliverables: prev.deliverables.map(d =>
                    d.id === commentModal.deliverableId
                        ? { ...d, is_accepted: commentModal.action === "accept", owner_comment: commentModal.comment, decision_at: new Date() }
                        : d
                ),
            }));

            setCommentModal({ open: false, deliverableId: null, action: null, comment: "" });
        } catch (err) {
            toast.error(err.message);
        }
    };

    // Add deliverable
    const handleAddDeliverable = async (message, files) => {
        try {
            if (!purchase?.id) return toast.error("Purchase ID is missing");

            const attachmentsMeta = files?.map(file => ({ filename: file.name, file_type: "general" }));
            const formData = new FormData();
            formData.append("purchase_id", purchase.id);
            formData.append("message", message || "");
            formData.append("attachments_meta", JSON.stringify(attachmentsMeta || []));
            files?.forEach(file => formData.append("files", file));

            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/purchase-deliverables/${id}`, {
                method: "POST",
                body: formData,
            });

            const json = await response.json();
            const data = json.data;
            if (!response.ok) throw new Error("فشل إضافة التسليم");

            toast.success("تم إضافة التسليم بنجاح");

            if (data) {
                setPurchase(prev => ({
                    ...prev,
                    deliverables: [...prev.deliverables, data],
                }));
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setAddDeliverableModal({ open: false, message: "", files: [] });
        }
    };

    // Final submission by provider
    const handleFinalSubmission = async () => {
        if (!purchase?.id) return toast.error("Purchase ID is missing");
        try {
            setFinalSubmissionLoading(true);
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/purchases/${purchase.id}/submit`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("فشل التسليم النهائي");
            toast.success("تم التسليم النهائي بنجاح");

            setPurchase(prev => ({
                ...prev,
                status: "submitted",
                timeline: [...(prev.timeline || []), { role: "provider", action: "submit", created_at: new Date().toISOString() }]
            }));


        } catch (err) {
            toast.error(err.message);
        } finally {
            setFinalSubmissionLoading(false);
        }
    };

    // Handle final submission by buyer (accept or reject)
    const handleBuyerFinalDecision = async (action) => {
        if (!purchase?.id) return toast.error("Purchase ID is missing");

        try {
            setFinalDecisionLoading(true); 

            const endpoint =
                action === "accept"
                    ? "accept-submission"
                    : action === "reject"
                        ? "reject-submission"
                        : null;

            if (!endpoint) throw new Error("إجراء غير صالح");

            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/purchases/${purchase.id}/${endpoint}`,
                { method: "PATCH", headers: { "Content-Type": "application/json" } }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "فشل تحديث التسليم النهائي");

            toast.success(
                data.message ||
                (action === "accept"
                    ? "تم قبول التسليم النهائي بنجاح"
                    : "تم رفض التسليم النهائي بنجاح")
            );

            setPurchase((prev) => ({
                ...prev,
                status: action === "accept" ? "completed" : "owner_rejected",
                timeline: [
                    ...(prev.timeline || []),
                    {
                        role: "buyer",
                        action: action === "accept" ? "complete" : "reject_final_submission",
                        created_at: new Date().toISOString(),
                    },
                ],
            }));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setFinalDecisionLoading(false);
        }
    };

    const onDisputeSuccess = (disputeId) => {
        router.push(`/disputes/${disputeId}`)
    }

    if (loading) return <div className="flex justify-center items-center py-20"><Loader /></div>;
    if (!purchase) return <div className="text-center py-20 text-gray-500">الشراء غير موجود</div>;

    const provider = purchase.service?.provider?.user;

    const loggedInUserRole = (() => {
        if (!state.user || !purchase) return null;
        if (state.user.id === purchase.buyer_id) return "buyer";
        if (state.user.id === purchase.service.provider_id) return "provider";
        if (state.user.role === "admin") return "admin";
        return null;
    })();

    return (
        <div className="pb-10 pt-12 px-4 md:px-6">
            <BackLink
                href={
                    loggedInUserRole === "provider"
                        ? `/services/${purchase?.service_id}`
                        : loggedInUserRole === "buyer"
                            ? `/my-purchases`
                            : `/purchases`
                }
            >
                {loggedInUserRole === "provider"
                    ? "العودة للخدمة"
                    : loggedInUserRole === "buyer"
                        ? "العودة لمشترياتي"
                        : "العودة للمشتريات"}
            </BackLink>

            <PageTitle title={purchase.service?.title || "تفاصيل الشراء"} className="mt-4" />

            {loggedInUserRole && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 text-center text-xl">
                    أنت <span className="font-bold">{translateServicePurchaseRole(loggedInUserRole)}</span> لهذا الشراء
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6 mt-6">
                {/* Sidebar */}
                <aside className="w-full lg:w-1/4 flex flex-col items-center gap-4 bg-white shadow-lg rounded-2xl p-6 border border-gray-100 h-fit">
                    <Avatar
                        url={
                            provider?.avatar
                                ? provider.avatar.startsWith("http")
                                    ? provider.avatar
                                    : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${provider.avatar}`
                                : undefined
                        }
                        fallbackLetter={provider?.first_name_ar?.charAt(0)?.toUpperCase() || "؟"}
                        alt={provider?.full_name_en || "Provider Avatar"}
                        size={96}
                        className="shadow-md"
                    />

                    <h4 className="font-bold text-lg md:text-xl mt-2 text-center text-label">
                        {provider?.first_name_ar} {provider?.last_name_ar}
                    </h4>
                    <p className="text-sm text-gray-500 text-center">{provider?.full_name_en}</p>

                    <div className="w-full p-5 mt-4 flex flex-col gap-3">
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">التقييم:</span>
                            <span className="text-label">{purchase?.service?.rating?.toFixed(1) || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">عدد التقييمات:</span>
                            <span className="text-label">{purchase?.service?.ratings_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">مدة التسليم:</span>
                            <span className="text-label">{purchase?.service?.delivery_time_days ? `${purchase.service.delivery_time_days} أيام` : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">حالة الشراء:</span>
                            <span className="text-label">{translateServicePurchaseStatus(purchase?.status)}</span>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="w-full lg:w-3/4 flex flex-col gap-6">
                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-4">
                        {loggedInUserRole === "provider" && purchase.status === "in_progress" && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="default" className="bg-primary text-white hover:bg-blue-400">
                                        تسليم نهائي
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl" className="rounded-2xl shadow-2xl border border-blue-200 p-6">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-2xl font-bold text-right">تأكيد التسليم النهائي</AlertDialogTitle>
                                        <AlertDialogDescription className="text-right mt-2">
                                            هل أنت متأكد من أنك تريد تقديم التسليم النهائي لهذا الطلب؟
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="justify-end gap-2">
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleFinalSubmission} className="bg-blue-600 text-white">تأكيد</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}

                        {loggedInUserRole === "buyer" && purchase.status === "submitted" && (
                            <>
                                <BuyerDecisionDialog
                                    action="accept"
                                    onConfirm={() => handleBuyerFinalDecision("accept")}
                                    loading={finalDecisionLoading}
                                />

                                <BuyerDecisionDialog
                                    action="reject"
                                    onConfirm={() => handleBuyerFinalDecision("reject")}
                                    loading={finalDecisionLoading}
                                />
                            </>


                        )}

                        <PurchaseDisputeButton
                            purchase={purchase}
                            loggedInUserRole={loggedInUserRole}
                            onDisputeSuccess={onDisputeSuccess}
                        />

                        <Link href={`/chats/purchase/${purchase.id}`}>
                            <Button variant="secondary" className="flex items-center gap-2">
                                <MessageCircle size={16} /> محادثة
                            </Button>
                        </Link>

                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-2xl p-6 shadow-inner flex flex-col gap-6">
                        <h2 className="text-2xl font-bold border-b pb-2 mb-4">وصف الخدمة</h2>
                        <p className="text-gray-700 leading-relaxed">{purchase.service?.description || "-"}</p>

                        {purchase.service.buyer_instructions && (
                            <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <h3 className="font-semibold text-lg mb-2">تعليمات المشتري</h3>
                                <p className="text-gray-700">{purchase.service.buyer_instructions}</p>
                            </div>
                        )}

                        {/* Timeline */}
                        {purchase.timeline?.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 border-b pb-1">سجل النشاط</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {purchase.timeline.map(item => (
                                        <li key={item.id}>
                                            {translateServicePurchaseRole(item.role)} قام {translateServicePurchaseAction(item.action)} في {new Date(item.created_at).toLocaleString("ar-EG")}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Deliverables */}
                        {purchase.deliverables?.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-xl font-bold mb-4 border-b pb-2 text-label">
                                    التسليمات
                                </h3>

                                {/* Provider Add Deliverable Button */}
                                {loggedInUserRole === "provider" && purchase.status === "in_progress" && (
                                    <div className="mb-4">
                                        <Button
                                            variant="default"
                                            onClick={() => setAddDeliverableModal({ open: true })}
                                        >
                                            إضافة تسليم جديد
                                        </Button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {purchase.deliverables.map((d) => (
                                        <div
                                            key={d.id}
                                            className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition p-5 flex flex-col gap-4"
                                        >
                                            {/* Main message */}
                                            <p className="text-label font-medium text-lg">{d.message}</p>

                                            {/* Attachments */}
                                            {d.attachments?.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="font-semibold text-gray-700">المرفقات:</p>
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {d.attachments.map((file) => (
                                                            <li key={file.id}>
                                                                <a
                                                                    href={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${file.file_url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline"
                                                                >
                                                                    {file.file_name}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Buyer comment */}
                                            {d.buyer_comment && (
                                                <p className="italic text-blue-700 text-sm">
                                                    تعليق المشتري: {d.buyer_comment}
                                                </p>
                                            )}

                                            {/* Status & Dates */}
                                            <div className="text-sm text-gray-600 space-y-1">
                                                {d.delivered_at && (
                                                    <p>
                                                        تم التسليم:{" "}
                                                        <span className="font-semibold">
                                                            {new Date(d.delivered_at).toLocaleString("ar-EG")}
                                                        </span>
                                                    </p>
                                                )}

                                                {d.is_accepted !== undefined && (
                                                    <p>
                                                        تم القبول:{" "}
                                                        <span
                                                            className={
                                                                d.is_accepted === true
                                                                    ? "text-green-600 font-semibold"
                                                                    : d.is_accepted === false
                                                                        ? "text-red-600 font-semibold"
                                                                        : "text-yellow-600 font-semibold"
                                                            }
                                                        >
                                                            {d.is_accepted === true
                                                                ? "نعم"
                                                                : d.is_accepted === false
                                                                    ? "لا"
                                                                    : "قيد الانتظار"}
                                                        </span>
                                                    </p>
                                                )}

                                                {d.is_accepted === true && d.decision_at && (
                                                    <p className="text-green-700">
                                                        تاريخ القبول:{" "}
                                                        <span className="font-semibold">
                                                            {new Date(d.decision_at).toLocaleString("ar-EG")}
                                                        </span>
                                                    </p>
                                                )}

                                                {d.is_accepted === false && d.decision_at && (
                                                    <p className="text-red-700">
                                                        تاريخ الرفض:{" "}
                                                        <span className="font-semibold">
                                                            {new Date(d.decision_at).toLocaleString("ar-EG")}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>

                                            {/* Owner comment */}
                                            {d.owner_comment && (
                                                <p className="italic text-gray-600 text-sm">
                                                    تعليق المالك: {d.owner_comment}
                                                </p>
                                            )}

                                            {/* Buyer action buttons */}
                                            {loggedInUserRole === "buyer" && d.is_accepted === null && (
                                                <div className="flex gap-2 mt-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            setCommentModal({ open: true, deliverableId: d.id, action: "accept", comment: "" })
                                                        }
                                                    >
                                                        قبول
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            setCommentModal({ open: true, deliverableId: d.id, action: "reject", comment: "" })
                                                        }
                                                    >
                                                        رفض
                                                    </Button>
                                                </div>
                                            )}

                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Comment Modal */}
            {commentModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-2">
                            {commentModal.action === "accept" ? "قبول التسليم" : "رفض التسليم"}
                        </h2>

                        <textarea
                            className="w-full border rounded-md p-2 mb-4"
                            placeholder="أضف تعليقك هنا..."
                            value={commentModal.comment}
                            onChange={(e) =>
                                setCommentModal((prev) => ({ ...prev, comment: e.target.value }))
                            }
                        />

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setCommentModal({ open: false, deliverableId: null, action: null, comment: "" })
                                }
                            >
                                إلغاء
                            </Button>
                            <Button onClick={handleDeliverableAction}>إرسال</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Deliverable Modal */}
            {addDeliverableModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">إضافة تسليم جديد</h2>

                        {/* Message textarea */}
                        <textarea
                            className="w-full border rounded-md p-2 mb-4 resize-none"
                            placeholder="أدخل رسالة التسليم هنا..."
                            value={addDeliverableModal.message}
                            onChange={(e) =>
                                setAddDeliverableModal((prev) => ({ ...prev, message: e.target.value }))
                            }
                        />

                        {/* Attachments */}
                        <div className="flex flex-col gap-2 mb-4">
                            <label className="text-lg font-semibold">إرفاق ملفات / صور</label>
                            <label
                                htmlFor="purchase_deliverable_files"
                                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                            >
                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-lg text-gray-600">اضغط لرفع الملفات</p>
                                <input
                                    id="purchase_deliverable_files"
                                    type="file"
                                    multiple
                                    onChange={(e) =>
                                        setAddDeliverableModal((prev) => ({
                                            ...prev,
                                            files: Array.from(e.target.files),
                                        }))
                                    }
                                    className="hidden"
                                />
                            </label>

                            {/* Preview uploaded files */}
                            {addDeliverableModal.files?.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {addDeliverableModal.files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 shadow-sm"
                                        >
                                            <span className="text-gray-700 text-lg font-medium truncate">{file.name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    setAddDeliverableModal((prev) => ({
                                                        ...prev,
                                                        files: prev.files.filter((_, i) => i !== index),
                                                    }))
                                                }
                                            >
                                                <X className="w-5 h-5 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setAddDeliverableModal({ open: false, message: "", files: [] })}
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={() => handleAddDeliverable(addDeliverableModal.message, addDeliverableModal.files)}
                            >
                                إضافة
                            </Button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}


function BuyerDecisionDialog({
    action, // "accept" or "reject"
    onConfirm,
    loading
}) {
    const titles = {
        accept: "تأكيد قبول التسليم النهائي",
        reject: "تأكيد رفض التسليم النهائي",
    };

    const descriptions = {
        accept: "هل أنت متأكد من أنك تريد قبول التسليم النهائي لهذا الشراء؟ سيتم إتمام الدفع وإغلاق الشراء.",
        reject: "هل أنت متأكد من أنك تريد رفض التسليم النهائي لهذا الشراء؟ سيعود العمل للمزود لإجراء التعديلات.",
    };

    const buttonColors = {
        accept: "bg-green-600 hover:bg-green-400",
        reject: "bg-red-600 hover:bg-red-400",
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="default" className={`${buttonColors[action]} text-white`}>
                    {action === "accept" ? "قبول التسليم النهائي" : "رفض التسليم النهائي"}
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent dir="rtl" className={`rounded-2xl shadow-2xl border p-6 border-${action === "accept" ? "green-200" : "red-200"}`}>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold text-right">{titles[action]}</AlertDialogTitle>
                    <AlertDialogDescription className="text-right mt-2">{descriptions[action]}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="justify-end gap-2">
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={`${buttonColors[action]} text-white`}
                        disabled={loading}
                    >
                        {loading ? "جاري المعالجة..." : "تأكيد"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


function PurchaseDisputeButton({ purchase, loggedInUserRole, onDisputeSuccess }) {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmitDispute = async () => {
        if (description.length < 10) return toast.error("الرجاء كتابة سبب أطول من 10 أحرف");
        try {
            setLoading(true);

            const endpoint =
                loggedInUserRole === "provider"
                    ? `/purchases/dispute/provider`
                    : `/purchases/dispute/buyer`;

            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reason: description,
                    note,
                    id: purchase.id,
                }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error("فشل رفع النزاع");

            toast.success("تم رفع النزاع بنجاح");
            setOpen(false);
            setDescription("");
            setNote("");

            if (onDisputeSuccess) onDisputeSuccess(json.data.id);

        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (["disputed_by_provider", "disputed_by_buyer"].includes(purchase.status)) return (
        <Button variant="default" className="bg-red-600 text-white hover:bg-red-400">
            <Link href={`/disputes/${purchase.dispute.id}`}>فتح صفحة النزاع</Link>
        </Button>
    );

    if (!["in_progress", "submitted", "buyer_rejected"].includes(purchase.status) || loggedInUserRole === "admin") return null;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                    فتح نزاع
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl" className="rounded-2xl shadow-2xl border border-red-200 p-6">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold text-right">رفع نزاع</AlertDialogTitle>
                    <AlertDialogDescription className="text-right mt-2">
                        الرجاء كتابة سبب النزاع بالتفصيل (10 أحرف على الأقل). يمكنك إضافة ملاحظة اختيارية.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="mt-4 flex flex-col gap-3">
                    <textarea
                        className="w-full border rounded-md p-2"
                        placeholder="سبب النزاع"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                    <textarea
                        className="w-full border rounded-md p-2"
                        placeholder="ملاحظة إضافية (اختياري)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                    />
                </div>
                <AlertDialogFooter className="justify-end gap-2 mt-4">
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleSubmitDispute}
                        className="bg-red-600 text-white"
                        disabled={loading}
                    >
                        {loading ? "جاري الإرسال..." : "تأكيد"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}