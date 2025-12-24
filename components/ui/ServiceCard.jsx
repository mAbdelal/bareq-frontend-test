import React from "react";
import Image from "next/image";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";

export default function ServiceCard({ service }) {
    const avatarUrl = service.provider?.user?.avatar
        ? service.provider.user.avatar.startsWith("http") 
            ? service.provider.user.avatar
            : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${service.provider.user.avatar}`
        : undefined;


    const fallbackLetter = service.provider?.user?.first_name_ar
        ? service.provider.user.first_name_ar.charAt(0)
        : "؟";

    return (
        <Link
            href={`/services/${service.id}`}
            className="block rounded-xl shadow hover:shadow-lg transition overflow-hidden border bg-white"
        >
            {/* Image */}
            <div className="relative w-full h-40 bg-gray-100">
                {service.attachments?.length ? (
                    <Image
                        src={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${service.attachments[0].file_url}`}
                        alt={service.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        لا يوجد صورة
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-base line-clamp-1 text-gray-900">
                        {service.title}
                    </h3>
                    <span className="text-primary font-bold text-sm">
                        {service.price} $
                    </span>
                </div>

                <div className="flex items-center gap-1 text-yellow-500 justify-end">
                    <span className="text-gray-500">
                        ({service.ratings_count ?? 0})
                    </span>
                    {service.rating ?? 0} ★
                </div>

                {/* Provider */}
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <Avatar
                        url={avatarUrl}
                        fallbackLetter={fallbackLetter}
                        alt={service.provider?.user?.full_name_en || "مستخدم"}
                        size={50}
                        className="ring-0 shadow-none"
                    />
                    <div className="flex flex-col gap-1">
                        <span className="font-medium">
                            {service.provider?.user?.first_name_ar}{" "}
                            {service.provider?.user?.last_name_ar}
                        </span>
                        <span>
                            {service.provider?.job_title || ""}
                        </span>
                    </div>
                </div>

            </div>
        </Link>
    );
}


export function MyServiceCard({ service }) {
    return (
        <Link
            href={`/services/private/${service.id}`}
            className="block rounded-xl shadow hover:shadow-lg transition overflow-hidden border bg-white"
        >
            {/* Image */}
            <div className="relative w-full h-40 bg-gray-100">
                {service.attachments?.length ? (
                    <Image
                        src={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${service.attachments[0].file_url}`}
                        alt={service.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        لا يوجد صورة
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-base line-clamp-1 text-gray-900">
                        {service.title}
                    </h3>
                    <span className="text-primary font-bold text-sm">
                        {service.price ? `${service.price} $` : "مجاني"}
                    </span>
                </div>

                <div className="flex items-center gap-1 text-yellow-500 justify-end text-sm">
                    <span className="text-gray-500">({service.ratings_count ?? 0})</span>
                    {service.rating ?? 0} ★
                </div>

                {/* Category / Subcategory */}
                <div className="mt-1 text-xs text-gray-500">
                    {service.category?.name} {service.academicSubcategory ? ` / ${service.academicSubcategory.name}` : ""}
                </div>
            </div>
        </Link>
    );
}