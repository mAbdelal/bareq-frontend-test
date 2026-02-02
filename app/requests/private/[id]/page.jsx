

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import PageTitle from "@/components/ui/page-title";
import Avatar from "@/components/ui/Avatar";
import OfferCard from "@/components/ui/OfferCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, MessageCircle, Upload, X } from "lucide-react";
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
import { translateRequestRole, translateRequestAction, translateRequestStatus } from "@/lib/translations";
import { useUser } from "@/context/UserContext";

export default function MyRequestDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { state } = useUser();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [finalAcceptLoading, setFinalAcceptLoading] = useState(false);
    const [finalSubmissionLoading, setFinalSubmissionLoading] = useState(false);
    const [commentModal, setCommentModal] = useState({ open: false, deliverableId: null, action: null, comment: "" });
    const [addDeliverableModal, setAddDeliverableModal] = useState({ open: false, message: "", files: [], });

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                setLoading(true);
                const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/requests/${id}`);
                if (!res.ok) throw new Error("فشل تحميل الطلب");
                const json = await res.json();
                setRequest(json.data);
            } catch (err) {
                console.error(err);
                toast.error(err.message);
                setRequest(null);
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [id]);

    const handleDelete = async () => {
        if (deleting) return;
        try {
            setDeleting(true);
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/requests/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("فشل حذف الطلب");
            toast.success("تم حذف الطلب بنجاح");
            router.push("/my-requests");
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء الحذف");
        } finally {
            setDeleting(false);
        }
    };

    const handleDeliverableAction = async () => {
        if (!commentModal.deliverableId || !commentModal.action) return;
        try {
            const endpoint = commentModal.action === "accept" ? "accept" : "reject";
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/request-deliverables/${commentModal.deliverableId}/${endpoint}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ comment: commentModal.comment }),
                }
            );
            if (!res.ok) throw new Error(`فشل ${commentModal.action === "accept" ? "قبول" : "رفض"} التسليم`);
            toast.success(`تم ${commentModal.action === "accept" ? "قبول" : "رفض"} التسليم`);

            setRequest(prev => ({
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

    const handleAcceptOffer = async (offerId) => {
        if (!request?.id) return;

        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/requests/${request.id}/offers/${offerId}/accept`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "فشل قبول العرض");
            }

            toast.success("تم قبول العرض بنجاح");

            // Update accepted offer in local state
            const accepted = request.offers.find(o => o.id === offerId);
            setRequest(prev => ({
                ...prev,
                accepted_offer: accepted,
                offers: prev.offers.filter(o => o.id !== offerId),
            }));
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء قبول العرض");
        }
    };
    const handleAddDeliverable = async (message, files) => {
        try {
            if (!request?.id) return toast.error("Request ID is missing");

            const attachmentsMeta = files?.map((file) => ({
                filename: file.name,
                file_type: "general",
            }));

            const formData = new FormData();
            formData.append("request_id", request.id);
            formData.append("message", message || "");
            formData.append("attachments_meta", JSON.stringify(attachmentsMeta || []));

            files?.forEach((file) => {
                formData.append("files", file);
            });

            const response = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/request-deliverables`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "فشل تحميل التسليم");
            }

            toast.success(data.message || "تم إضافة التسليم بنجاح");

            if (data.deliverable) {
                setRequest((prev) => ({
                    ...prev,
                    deliverables: [...prev.deliverables, data.deliverable],
                }));
            }
        } catch (err) {
            toast.error(err.message);

        } finally {
            setAddDeliverableModal({ open: false, message: "", files: [] });
        }
    };

    const handleFinalSubmission = async () => {
        try {
            const requestId = request.id;
            if (!requestId) return toast.error("Request ID is missing");

            setFinalSubmissionLoading(true);

            const response = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/requests/${requestId}/submit`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "فشل التسليم النهائي");
            }

            toast.success(data.message || "تم التسليم النهائي بنجاح");

            setRequest((prev) => ({
                ...prev,
                status: "submitted",
                CustomRequestTimeline: [
                    ...(prev.CustomRequestTimeline || []),
                    {
                        actor_role: "provider",
                        action: "submit",
                        created_at: new Date().toISOString(),
                    },
                ],
            }));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setFinalSubmissionLoading(false);
        }
    };


    const handleAcceptFinalSubmission = async () => {
        try {
            if (!request?.id) return toast.error("Request ID is missing");

            setFinalAcceptLoading(true);

            const response = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/requests/${request.id}/accept-submission`,
                {
                    method: "PATCH", // 
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "فشل قبول التسليم النهائي");
            }

            toast.success(data.message || "تم قبول التسليم النهائي بنجاح");

            setRequest((prev) => ({
                ...prev,
                status: "completed",
                CustomRequestTimeline: [
                    ...(prev.CustomRequestTimeline || []),
                    {
                        actor_role: "owner",
                        action: "complete",
                        created_at: new Date().toISOString(),
                    },
                ],
            }));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setFinalAcceptLoading(false);
        }
    };

    const onDisputeSuccess = (disputeId) => {
        router.push(`/disputes/${disputeId}`)
    }


    if (loading) return <div className="flex justify-center items-center py-20"><Loader /></div>;
    if (!request) return <div className="text-center py-20 text-gray-500">الطلب غير موجود</div>;

    const requester = request.requester;

    let loggedInUserRole = null;
    if (state.user) {
        if (state.user.id === requester.user.id) loggedInUserRole = "owner";
        else if (request.accepted_offer?.provider_id === state.user.id) loggedInUserRole = "provider";
        else if (state.user.role) loggedInUserRole = "admin";
        else router.push("/requests");
    }

    return (
        <div className="pb-10 pt-12 px-4 md:px-6">
            <BackLink href={loggedInUserRole === "admin" ? "/admin/dashboard" : "/my-requests"}>
                {loggedInUserRole === "admin" ? "العودة للرئيسية" : "العودة لطلباتي"}
            </BackLink>
            <PageTitle title={request.title} />

            {loggedInUserRole && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 text-center text-xl">
                    أنت <span className="font-bold">{translateRequestRole(loggedInUserRole)}</span> لهذا الطلب
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6 mt-6">
                {/* Sidebar */}
                <aside className="w-full lg:w-1/4 flex flex-col items-center gap-4 bg-white shadow-lg rounded-2xl p-6 border border-gray-100 h-fit">
                    <Avatar
                        url={
                            requester.user?.avatar
                                ? requester.user.avatar.startsWith("http")
                                    ? requester.user.avatar
                                    : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${requester.user.avatar}`
                                : undefined
                        }
                        fallbackLetter={requester.user?.first_name_ar?.charAt(0)?.toUpperCase() || "؟"}
                        alt={requester.user?.full_name_en || "Requester Avatar"}
                        size={96}
                        className="shadow-md"
                    />

                    <h4 className="font-bold text-lg md:text-xl mt-2 text-center text-label">
                        {requester.user?.first_name_ar} {requester.user?.last_name_ar}
                    </h4>
                    <p className="text-sm text-gray-500 text-center">{requester.user?.full_name_en}</p>

                    <div className="w-full p-5 mt-4 flex flex-col gap-3">
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">الميزانية:</span>
                            <span className="text-label">{request.budget ? `$${request.budget}` : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">مدة التسليم:</span>
                            <span className="text-label">{request.expected_delivery_days ? `${request.expected_delivery_days} أيام` : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700"> حالة الطلب:</span>
                            <span className="text-label"> {translateRequestStatus(request.status)}</span>
                        </div>
                        {request.category?.name && (
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-700">التصنيف الرئيسي:</span>
                                <span className="text-label">{request.category.name}</span>
                            </div>
                        )}
                        {request.subcategory?.name && (
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-700">التصنيف الفرعي:</span>
                                <span className="text-label">{request.subcategory.name}</span>
                            </div>
                        )}

                    </div>
                </aside>

                {/* Main Content */}
                <div className="w-full lg:w-3/4 flex flex-col gap-6">

                    {/* Actions */}
                    {(loggedInUserRole === "owner" || loggedInUserRole === "provider" || loggedInUserRole === "admin") && (
                        <div className="flex justify-end gap-2 mt-4">
                            {/* Owner edit/delete (only when status is open) */}
                            {loggedInUserRole === "owner" && request.status === "open" && (
                                <>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                className="flex items-center gap-2"
                                                disabled={deleting}
                                            >
                                                <Trash2 size={16} /> {deleting ? "جارٍ الحذف..." : "حذف"}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent
                                            dir="rtl"
                                            className="rounded-2xl shadow-2xl border border-red-200 p-6"
                                        >
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-2xl font-bold text-destructive text-right">
                                                    هل أنت متأكد من الحذف؟
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-gray-700 text-right">
                                                    لا يمكن التراجع عن هذه العملية بعد تنفيذها. سيتم حذف الطلب بشكل
                                                    <span className="font-semibold text-destructive"> نهائي</span>.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex flex-row-reverse gap-4 mt-6">
                                                <AlertDialogCancel className="rounded-xl px-8 py-3 text-lg border hover:bg-gray-100 transition">
                                                    إلغاء
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDelete}
                                                    disabled={deleting}
                                                    className="rounded-xl px-8 py-3 text-lg bg-destructive text-white font-semibold shadow hover:bg-destructive/90 transition disabled:opacity-50"
                                                >
                                                    {deleting ? "جاري الحذف..." : "نعم، احذف"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}

                            {/* Provider: Final Deliverable button */}
                            {loggedInUserRole === "provider" && request.status === "in_progress" && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="default" className="bg-primary text-white hover:bg-blue-400">
                                            تسليم نهائي
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent dir="rtl" className="rounded-2xl shadow-2xl border border-blue-200 p-6">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-2xl font-bold text-right">
                                                تأكيد التسليم النهائي
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-700 text-right">
                                                هل أنت متأكد أنك تريد تسليم هذا الطلب نهائيًا؟ لا يمكن التراجع عن هذا القرار لاحقًا.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="flex flex-row-reverse gap-4 mt-6">
                                            <AlertDialogCancel className="rounded-xl px-8 py-3 text-lg border hover:bg-gray-100 transition">
                                                إلغاء
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleFinalSubmission}
                                                disabled={finalSubmissionLoading}
                                                className="rounded-xl px-8 py-3 text-lg bg-primary text-white font-semibold shadow hover:bg-blue-400 transition disabled:opacity-50"
                                            >
                                                {finalSubmissionLoading ? "جاري التسليم..." : "تأكيد"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            {/* Owner: Accept Final Deliverable button */}
                            {loggedInUserRole === "owner" &&
                                request.status === "submitted" && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="default" className="bg-primary text-white hover:bg-blue-400">
                                                قبول التسليم النهائي
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent dir="rtl" className="rounded-2xl shadow-2xl border border-green-200 p-6">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-2xl font-bold text-right">
                                                    تأكيد قبول التسليم النهائي
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-gray-700 text-right">
                                                    هل أنت متأكد أنك تريد قبول التسليم النهائي لهذا الطلب؟ سيتم إتمام الدفع وإغلاق الطلب.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex flex-row-reverse gap-4 mt-6">
                                                <AlertDialogCancel className="rounded-xl px-8 py-3 text-lg border hover:bg-gray-100 transition">
                                                    إلغاء
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleAcceptFinalSubmission}
                                                    disabled={finalAcceptLoading}
                                                    className="rounded-xl px-8 py-3 text-lg bg-primary text-white font-semibold shadow hover:bg-blue-400 transition disabled:opacity-50"
                                                >
                                                    {finalAcceptLoading ? "جاري القبول..." : "تأكيد"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                            <RequestDisputeButton
                                request={request}
                                loggedInUserRole={loggedInUserRole}
                                onDisputeSuccess={onDisputeSuccess}
                            />

                            {/* Chat button for both roles */}
                            {request.accepted_offer && (
                                <Link href={`/chats/offer/${request.accepted_offer.id}`}>
                                    <Button variant="secondary" className="flex items-center gap-2">
                                        <MessageCircle size={16} /> محادثة
                                    </Button>
                                </Link>
                            )}

                        </div>
                    )}

                    {/* Attachments */}
                    <div className="bg-white rounded-2xl p-4 shadow-inner flex flex-col gap-2">
                        <h3 className="text-lg font-semibold mb-2 border-b pb-1">المرفقات</h3>
                        {request.attachments?.length ? (
                            <div className="flex flex-col gap-2">
                                {request.attachments.map(att => (
                                    <a
                                        key={att.id}
                                        href={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${att.file_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline hover:text-blue-800"
                                    >
                                        {att.file_name}
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full h-20 bg-gray-200 flex items-center justify-center rounded-xl text-gray-500 font-medium">
                                لا توجد مرفقات
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-2xl p-6 shadow-inner flex flex-col gap-6">
                        <h2 className="text-2xl font-bold border-b pb-2 mb-4">وصف الطلب</h2>
                        <p className="text-gray-700 leading-relaxed">{request.description}</p>

                        {/* Timeline */}
                        {request.CustomRequestTimeline?.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 border-b pb-1">سجل النشاط</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {request.CustomRequestTimeline.map(item => (
                                        <li key={item.id}>
                                            {translateRequestRole(item.actor_role)} قام {translateRequestAction(item.action)} في {new Date(item.created_at).toLocaleString("ar-EG")}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Deliverables */}
                        {request.deliverables?.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-xl font-bold mb-4 border-b pb-2 text-label">
                                    التسليمات
                                </h3>

                                {/* Provider Add Deliverable Button */}
                                {loggedInUserRole === "provider" && request.status === "in_progress" && (
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
                                    {request?.deliverables?.length > 0 ? (
                                        request.deliverables.map((d) => (
                                            <div
                                                key={d?.id}
                                                className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition p-5 flex flex-col gap-4"
                                            >
                                                {/* Main message */}
                                                <p className="text-label font-medium text-lg">{d?.message || "-"}</p>

                                                {/* Attachments */}
                                                {d?.attachments?.length > 0 && (
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

                                                {/* Requester comment */}
                                                {d?.requester_comment && (
                                                    <p className="italic text-blue-700 text-sm">
                                                        تعليق مقدم الطلب: {d.requester_comment}
                                                    </p>
                                                )}

                                                {/* Status & Dates */}
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    {d?.delivered_at && (
                                                        <p>
                                                            تم التسليم:{" "}
                                                            <span className="font-semibold">
                                                                {new Date(d.delivered_at).toLocaleString()}
                                                            </span>
                                                        </p>
                                                    )}

                                                    {d?.is_accepted !== undefined && (
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

                                                    {d?.is_accepted === true && d?.decision_at && (
                                                        <p className="text-green-700">
                                                            تاريخ القبول:{" "}
                                                            <span className="font-semibold">
                                                                {new Date(d.decision_at).toLocaleString()}
                                                            </span>
                                                        </p>
                                                    )}

                                                    {d?.is_accepted === false && d?.decision_at && (
                                                        <p className="text-red-700">
                                                            تاريخ الرفض:{" "}
                                                            <span className="font-semibold">
                                                                {new Date(d.decision_at).toLocaleString()}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Owner comment */}
                                                {d?.owner_comment && (
                                                    <p className="italic text-gray-600 text-sm">
                                                        تعليق المالك: {d.owner_comment}
                                                    </p>
                                                )}

                                                {/* Owner Buttons */}
                                                {loggedInUserRole === "owner" && d?.is_accepted === null && (
                                                    <div className="flex gap-3 mt-2">
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 bg-primary text-white hover:bg-blue-400"
                                                            onClick={() =>
                                                                setCommentModal({
                                                                    open: true,
                                                                    deliverableId: d?.id,
                                                                    action: "accept",
                                                                    comment: "",
                                                                })
                                                            }
                                                        >
                                                            قبول
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            className="flex-1"
                                                            onClick={() =>
                                                                setCommentModal({
                                                                    open: true,
                                                                    deliverableId: d?.id,
                                                                    action: "reject",
                                                                    comment: "",
                                                                })
                                                            }
                                                        >
                                                            رفض
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">لا يوجد تسليمات بعد</p>
                                    )}


                                </div>

                            </div>
                        )}


                        {request.accepted_offer ? (
                            // Show only the accepted offer
                            <div>
                                <h3 className="text-lg font-semibold mb-2 pb-1">العرض المقبول</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <OfferCard key={request.accepted_offer.id} offer={request.accepted_offer} />
                                </div>
                            </div>
                        ) : request.offers?.length > 0 ? (
                            // Show all offers if none is accepted yet
                            <div>
                                <h3 className="text-lg font-semibold mb-2 pb-1">العروض المقدمة</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-fit ">
                                    {request.offers.map((offer) => (
                                        <div key={offer.id} className="flex flex-col gap-3 p-4 shadow-sm bg-white rounded-2xl w-fit">
                                            <OfferCard offer={offer} />

                                            {/* Owner actions */}
                                            {loggedInUserRole === "owner" && (
                                                <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
                                                    <AlertDialog className="flex-1" dir="rtl">
                                                        <AlertDialogTrigger asChild>
                                                            <Button className="w-full sm:w-auto">قبول العرض</Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="text-right">تأكيد قبول العرض</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-right">
                                                                    هل أنت متأكد أنك تريد قبول هذا العرض؟ لا يمكن التراجع عن هذا القرار لاحقًا.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter className="flex flex-row-reverse gap-2">
                                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => {
                                                                        handleAcceptOffer(offer.id);
                                                                    }}
                                                                >
                                                                    تأكيد
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>


                                                    <Button
                                                        variant="outline"
                                                        className="w-full sm:flex-1 text-primary border border-primary hover:bg-blue-100  bg-white"
                                                        onClick={() => router.push(`/chats/offer/${offer.id}`)}
                                                    >
                                                        مراسلة مقدم العرض
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        ) : (
                            <div>
                                <h3 className="text-lg font-semibold mb-2-b pb-1">العروض المقدمة</h3>
                                <p className="text-gray-500">لا توجد عروض حتى الآن</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Comment Modal */}
            {commentModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-2">{commentModal.action === "accept" ? "قبول التسليم" : "رفض التسليم"}</h2>
                        <textarea
                            className="w-full border rounded-md p-2 mb-4"
                            placeholder="أضف تعليقك هنا..."
                            value={commentModal.comment}
                            onChange={e => setCommentModal(prev => ({ ...prev, comment: e.target.value }))}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCommentModal({ open: false, deliverableId: null, action: null, comment: "" })}>
                                إلغاء
                            </Button>
                            <Button onClick={handleDeliverableAction}>إرسال</Button>
                        </div>
                    </div>
                </div>
            )}

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
                            <label className="text-lg font-semibold">إرفاق صور / ملفات</label>
                            <label
                                htmlFor="deliverable_files"
                                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                            >
                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-lg text-gray-600">اضغط لرفع الملفات</p>
                                <input
                                    id="deliverable_files"
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
                                onClick={() => {
                                    handleAddDeliverable(addDeliverableModal.message, addDeliverableModal.files);
                                }}
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


function RequestDisputeButton({ request, loggedInUserRole, onDisputeSuccess }) {
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
                    ? `/requests/dispute/provider`
                    : `/requests/dispute/owner`;

            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, complainant_note: note, request_id: request.id }),
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

    if (["disputed_by_provider", "disputed_by_owner"].includes(request.status)) return (
        <Button variant="default" className="bg-red-600 text-white hover:bg-red-400">
            <Link href={`/disputes/${request.dispute.id}`}>فتح صفحة النزاع</Link>
        </Button>
    );

    if (!["in_progress", "submitted", "owner_rejected"].includes(request.status) || loggedInUserRole === "admin") return null;

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
