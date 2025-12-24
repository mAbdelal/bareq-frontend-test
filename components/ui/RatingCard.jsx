import React from "react";
import Avatar from "@/components/ui/Avatar"; 

export default function RatingCard({ rating }) {
    const avatarUrl = rating.user?.avatar
        ? rating.user.avatar.startsWith("http")
            ? rating.user.avatar 
            : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${rating.user.avatar}` 
        : undefined;


    const fallbackLetter = rating.user?.first_name_ar
        ? rating.user.first_name_ar.charAt(0)
        : "؟";

    return (
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden mb-6 p-4 flex flex-col gap-3 text-right hover:shadow-2xl transition-shadow">
            {/* Avatar and Name */}
            <div className="flex items-center gap-3">
                <Avatar url={avatarUrl} fallbackLetter={fallbackLetter} size={48} />
                <div>
                    <p className="font-bold text-sm md:text-base">
                        {rating.user?.first_name_ar ?? "-"} {rating.user?.last_name_ar ?? ""}
                    </p>
                    <p className="text-label text-xs md:text-sm">
                        {rating.user?.full_name_en ?? ""}
                    </p>
                </div>
            </div>

            {/* Service/Request Info */}
            <p className="font-semibold text-sm md:text-base mt-2">
                {rating.service_title ?? rating.custom_request_title ?? "-"}
            </p>

            {/* Rating Stars */}
            <div className="flex items-center gap-2 text-yellow-500">
                ★ {rating.rating ?? 0}
                <span className="text-gray-500 text-sm">
                    ({rating.comment ?? "بدون تعليق"})
                </span>
            </div>

            {/* Optional Comment */}
            {rating.comment && rating.comment.trim() !== "" && (
                <p className="text-label text-sm md:text-base mt-1">{rating.comment}</p>
            )}
        </div>
    );
}
