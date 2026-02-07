"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import fetchWithAuth from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { useUser } from "@/context/UserContext";
import PageTitle from "@/components/ui/page-title";
import Avatar from "@/components/ui/Avatar";
import BackLink from "@/components/ui/back-link";
import { Star, MessageSquare, FileText } from "lucide-react";
import { translateDisputeStatus } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function DisputePage() {
    const { id } = useParams();
    const router = useRouter();
    const { state } = useUser();

    const [dispute, setDispute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [solution, setSolution] = useState("");
    const [adminAction, setAdminAction] = useState("");

    const isAdmin = state.user?.role !== null;
    const currentUserId = state.user?.id;

    useEffect(() => {
        const fetchDispute = async () => {
            try {
                const res = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/disputes/${id}`
                );
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "فشل تحميل النزاع");
                setDispute(json.data);
            } catch (err) {
                router.replace("/404");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDispute();
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader />
            </div>
        );
    }

    if (!dispute) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>النزاع غير موجود</p>
            </div>
        );
    }

    const { complainant, respondent } = dispute;

    const otherUser =
        !isAdmin && currentUserId === complainant.user.id
            ? respondent
            : !isAdmin && currentUserId === respondent.user.id
                ? complainant
                : null;

    let chatLink = null;
    let entityLink = null;

    if (dispute.servicePurchase) {
        if (dispute.servicePurchase.chat) {
            chatLink = `/chats/purchase/${dispute.servicePurchase.chat.id}`;
        }
        entityLink = `/purchases/${dispute.service_purchase_id}`;
    } else if (dispute.customRequest) {
        if (dispute.customRequest.accepted_offer?.chat) {
            chatLink = `/chats/offer/${dispute.customRequest.accepted_offer.chat.id}`;
        }
        if (dispute.customRequest.requester_id === currentUserId) {
            entityLink = `/requests/private/${dispute.custom_request_id}`;
        }else{
            entityLink = `/requests/${dispute.custom_request_id}`;
        }
    } 
    // Handle submit
    const handleResolve = async () => {
        try {
            const endpoint = dispute.servicePurchase
                ? "disputes/resolve/service-purchase"
                : "disputes/resolve/custom-request";

            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        dispute_id: dispute.id,
                        solution,
                        admin_action: adminAction,
                    }),
                }
            );

            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "فشل حل النزاع");

            toast.success("تم حل النزاع بنجاح");
            setOpenDialog(false);
            router.refresh();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const actionOptions = dispute.servicePurchase
        ? [
            { value: "refund_buyer", label: "إرجاع المبلغ للمشتري" },
            { value: "pay_provider", label: "دفع للمزود" },
            { value: "ask_provider_to_redo", label: "إعادة العمل" },
            { value: "split", label: "تقسيم المبلغ" },
            { value: "charge_both", label: "خصم من الطرفين" },
        ]
        : [
            { value: "refund_owner", label: "إرجاع المبلغ لصاحب الطلب" },
            { value: "pay_provider", label: "دفع للمزود" },
            { value: "ask_provider_to_redo", label: "إعادة العمل" },
            { value: "split", label: "تقسيم المبلغ" },
            { value: "charge_both", label: "خصم من الطرفين" },
        ];

    return (
        <div className="h-screen flex flex-col">
            <div className="p-4 mt-5">
                <BackLink href="/home">العودة للرئيسية</BackLink>
            </div>

            <div className="p-4">
                <PageTitle title="تفاصيل النزاع" className="h-fit" />
            </div>

            <div className="flex flex-1 overflow-hidden -mt-9 flex-col md:flex-row">
                {/* Sidebar */}
                <div className="w-full md:w-1/4 p-4 space-y-6">
                    {isAdmin ? (
                        <>
                            <UserCard user={complainant} label="مقدم الشكوى" />
                            <UserCard user={respondent} label="المدعى عليه" />
                        </>
                    ) : (
                        otherUser && (
                            <UserCard
                                user={otherUser}
                                label={complainant === otherUser ? "مقدم الشكوى" : "المدعى عليه"}
                            />
                        )
                    )}
                </div>

                {/* Dispute Info */}
                <div className="w-full md:w-3/4 p-6 bg-white rounded-xl shadow-md space-y-6">
                    {/* Links */}
                    <div className="flex gap-3">
                        {chatLink && (
                            <Button
                                onClick={() => router.push(chatLink)}
                                variant="default"
                                className="flex items-center gap-2"
                            >
                                <MessageSquare size={16} />
                                الذهاب إلى المحادثة
                            </Button>
                        )}
                        {entityLink && (
                            <Button
                                onClick={() => router.push(entityLink)}
                                variant="default"
                                className="flex items-center gap-2"
                            >
                                <FileText size={16} />
                                عرض {dispute.servicePurchase ? "الشراء" : "الطلب"}
                            </Button>
                        )}
                    </div>

                    <div>
                        <h2 className="font-semibold text-lg border-t pt-4">وصف النزاع</h2>
                        <p className="text-gray-700 mt-2">{dispute.description}</p>
                    </div>

                    {dispute.complainant_note && (
                        <div className="pt-4 border-t">
                            <h2 className="font-semibold text-lg">ملاحظة مقدم الشكوى</h2>
                            <p className="text-gray-700 mt-2">{dispute.complainant_note}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                (تُعتبر تلميحًا من مقدم الشكوى للإدارة)
                            </p>
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <h2 className="font-semibold text-lg">الحالة</h2>
                        <p className="text-gray-700 mt-2">
                            {translateDisputeStatus(dispute.status)}
                        </p>
                    </div>

                    {dispute.solution && (
                        <div className="pt-4 border-t">
                            <h2 className="font-semibold text-lg">قرار الإدارة</h2>
                            <p className="text-gray-700 mt-2">{dispute.solution}</p>
                            {dispute.admin_decision_at && (
                                <p className="text-sm text-gray-500 mt-1">
                                    بتاريخ {new Date(dispute.admin_decision_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="pt-4 border-t text-sm text-gray-500">
                        <p>تاريخ الإنشاء: {new Date(dispute.created_at).toLocaleString()}</p>
                        <p>آخر تحديث: {new Date(dispute.updated_at).toLocaleString()}</p>
                    </div>


                    {/* Admin resolve button */}
                    {isAdmin &&
                        ["open", "under_review"].includes(dispute.status) && (
                            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive">اتخاذ قرار</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>اتخاذ قرار بشأن النزاع</DialogTitle>
                                    </DialogHeader>

                                    <div className="space-y-4 mt-4">
                                        <div>
                                            <Label>الحل</Label>
                                            <Textarea
                                                value={solution}
                                                onChange={(e) => setSolution(e.target.value)}
                                                placeholder="اكتب الحل..."
                                            />
                                        </div>

                                        <div>
                                            <Label>الإجراء</Label>
                                            <Select
                                                value={adminAction}
                                                onValueChange={setAdminAction}
                                                className="w-full text-right"
                                                dir="rtl"
                                            >
                                                <SelectTrigger className="w-full text-right" dir="rtl">
                                                    <SelectValue placeholder="اختر إجراء" className="text-right" />
                                                </SelectTrigger>
                                                <SelectContent dir="rtl">
                                                    {actionOptions.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value} className="text-right">
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                        </div>

                                        <Button
                                            onClick={handleResolve}
                                            disabled={!solution || !adminAction}
                                        >
                                            تأكيد
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                </div>
            </div>
        </div>
    );
}

function UserCard({ user, label }) {
    return (
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md">
            <Avatar
                url={
                    user.user?.avatar
                        ? user.user.avatar.startsWith("http")
                            ? user.user.avatar // external (Google) avatar
                            : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${user.user.avatar}` // local upload
                        : null
                }
                fallbackLetter={user.user?.first_name_ar?.charAt(0)?.toUpperCase() || "U"}
                alt={user.user?.first_name_ar || "User Avatar"}
                size={48}
            />

            <div className="flex flex-col">
                {label && <span className="text-xs text-gray-500">{label}</span>}
                <span className="font-semibold text-gray-800">
                    {user.user?.first_name_ar} {user.user?.last_name_ar}
                </span>
                <span className="flex items-center gap-1 text-yellow-500 text-sm">
                    <Star size={14} /> {user?.rating || 0} ({user?.ratings_count || 0})
                </span>
            </div>
        </div>
    );
}
