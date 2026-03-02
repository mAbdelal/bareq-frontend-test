"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    DollarSign,
    Clock,
    FileText,
    Trash2
} from "lucide-react";

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

import { translateRequestStatus } from "@/lib/translations";

export function MyOfferCard({ offer, onDeleted }) {

    const [loading, setLoading] = useState(false);

    const renderStatus = () => {
        if (offer.request?.accepted_offer_id === offer.id) {
            return translateRequestStatus(offer.request?.status);
        } else if (!offer.request?.accepted_offer_id) {
            return "مفتوح";
        } else {
            return "مغلق";
        }
    };

    const handleDelete = async () => {
        try {
            setLoading(true);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/requests/${offer.request?.id}/offers/my`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                throw new Error("فشل الحذف");
            }

            if (onDeleted) {
                onDeleted(offer.id);
            }

        } catch (err) {
            console.error("Delete error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition bg-white p-5 flex flex-col gap-4">

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-800 truncate">
                {offer.request?.title}
            </h3>

            <div className="flex flex-col gap-3 text-sm text-gray-700">

                {/* Request Info */}
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span>ميزانية الطلب: ${offer.request?.budget}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>مدة التسليم المتوقعة: {offer.request?.expected_delivery_days} يوم</span>
                </div>

                {/* Offer Info */}
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span>عرضك: ${offer.price}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>تسليمك: {offer.delivery_days} يوم</span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 text-sm text-label">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span>حالة الطلب: {renderStatus()}</span>
                </div>

                {/* View Link */}
                <Link
                    href={
                        offer.request?.accepted_offer_id === offer.id
                            ? `/requests/private/${offer.request?.id}`
                            : `/requests/${offer.request?.id}`
                    }
                    className="text-primary font-medium mt-2 hover:underline text-sm"
                >
                    → عرض تفاصيل الطلب
                </Link>

                {/* Delete Button */}
                {!offer.request?.accepted_offer_id && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                disabled={loading}
                                className="flex items-center justify-center gap-2 mt-3 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm transition disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                حذف العرض
                            </button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    هل أنت متأكد من حذف العرض؟
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    لا يمكن التراجع عن هذا الإجراء بعد الحذف.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel>
                                    إلغاء
                                </AlertDialogCancel>

                                <AlertDialogAction
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    {loading ? "جاري الحذف..." : "نعم، احذف العرض"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

            </div>
        </div>
    );
}