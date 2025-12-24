"use client";

import React from "react";
import Avatar from "@/components/ui/Avatar";
import { Paperclip, DollarSign, Clock, FileText } from "lucide-react";
import { translateRequestStatus } from "@/lib/translations";
import Link from "next/link";


export default function OfferCard({ offer }) {
    const provider = offer.provider?.user;
    const attachments = offer.attachments || [];

    return (
        <div className="bg-white shadow-lg rounded-xl p-4 flex flex-col justify-between hover:shadow-xl transition">
            {/* Provider Info */}
            <div className="flex items-center gap-3 mb-3">
                <Avatar
                    url={
                        provider?.avatar
                            ? provider.avatar.startsWith("http") 
                                ? provider.avatar 
                                : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${provider.avatar}` 
                            : undefined
                    }
                    fallbackLetter={provider?.first_name_ar?.charAt(0) || "؟"}
                    alt={provider?.full_name_en || "Provider Avatar"}
                />

                <div>
                    <h4 className="font-semibold text-label">
                        {provider?.first_name_ar} {provider?.last_name_ar}
                    </h4>
                    <p className="text-sm text-gray-500">{provider?.full_name_en}</p>
                </div>
            </div>

            {/* Price & Delivery */}
            <div className="flex justify-between text-sm text-gray-700 mb-2">
                <div>
                    <span className="font-semibold">السعر: </span>
                    {offer.price ? `$${offer.price}` : "-"}
                </div>
                <div>
                    <span className="font-semibold">مدة التسليم: </span>
                    {offer.delivery_days
                        ? offer.delivery_days === 1
                            ? "يوم واحد"
                            : `${offer.delivery_days} أيام`
                        : "-"}
                </div>
            </div>

            {/* Offer Message */}
            {offer.message && (
                <p className="text-gray-700 text-sm mb-2 line-clamp-3">
                    {offer.message}
                </p>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((att) => (
                        <a
                            key={att.id}
                            href={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${att.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-16 relative rounded-lg overflow-hidden border border-gray-200 flex flex-col items-center justify-center w-full bg-gray-50 hover:bg-gray-100 transition p-1"
                        >
                            <Paperclip className="w-6 h-6 text-gray-500 mb-1" />
                            <span className="text-xs text-label text-center truncate w-full">
                                {att.file_name}
                            </span>
                        </a>
                    ))}
                </div>
            )}


        </div>
    );
}

export function MyOfferCard({ offer }) {

    const renderStatus = () => {
        if (offer.request?.accepted_offer_id === offer.id) {
            return translateRequestStatus(offer.request?.status);
        } else if (!offer.request?.accepted_offer_id) {
            return "مفتوح";
        } else {
            return "مغلق";
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
            </div>

        </div>
    );
}
