"use client";

import React from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";

export default function RequestCard({ request }) {
    const requester = request.requester?.user;
    const skills = request.skills || [];

    return (
        <Link href={`/requests/${request.id}`} className="block h-full group">
            <div className="bg-white shadow-lg rounded-2xl cursor-pointer transform transition-all duration-300 hover:shadow-xl hover:scale-105 min-h-[250px] flex flex-col p-4">

                {/* Top Section */}
                <div className="mb-3">
                    {/* Requester Info */}
                    <div className="flex items-center gap-3 mb-2">
                        <Avatar
                            url={
                                requester?.avatar
                                    ? requester.avatar.startsWith("http") 
                                        ? requester.avatar
                                        : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${requester.avatar}`
                                    : undefined
                            }
                            fallbackLetter={requester?.first_name_ar?.charAt(0) || "؟"}
                            alt={requester?.full_name_en}
                            size={40}
                        />

                        <div>
                            <h4 className="font-semibold text-gray-800 group-hover:text-primary transition-colors text-sm md:text-base">
                                {requester?.first_name_ar} {requester?.last_name_ar}
                            </h4>
                            <p className="text-xs text-gray-500">{requester?.full_name_en}</p>
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-md font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {request.title}
                    </h3>

                    {/* Skills */}
                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {skills.map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Section */}
                <div className="mt-auto border-t pt-2">
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                        <div>
                            <span className="font-semibold">الميزانية: </span>
                            {request.budget ? `$${request.budget}` : "-"}
                        </div>
                        <div>
                            <span className="font-semibold">مدة التسليم: </span>
                            {request.expected_delivery_days
                                ? request.expected_delivery_days === 1
                                    ? "يوم واحد"
                                    : `${request.expected_delivery_days} أيام`
                                : "-"}
                        </div>
                    </div>

                    <div className="text-xs text-gray-500">
                        <span className="font-semibold">التصنيف: </span>
                        {request.category?.name || "-"}
                        {request.subcategory?.name ? ` | ${request.subcategory.name}` : ""}
                    </div>

                </div>
            </div>
        </Link>
    );
}


export function MyRequestsCard({ request }) {
    const skills = request.skills || [];

    return (
        <Link href={`/requests/private/${request.id}`} className="block h-full group">
            <div className="bg-white shadow-lg rounded-2xl cursor-pointer transform transition-all duration-300 hover:shadow-xl hover:scale-105 min-h-[220px] flex flex-col p-4">

                {/* Top Section */}
                <div className="mb-3">
                    {/* Title */}
                    <h3 className="text-md font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {request.title}
                    </h3>

                    {/* Skills */}
                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {skills.map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Section */}
                <div className="mt-auto border-t pt-2">
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                        <div>
                            <span className="font-semibold">الميزانية: </span>
                            {request.budget ? `$${request.budget}` : "-"}
                        </div>
                        <div>
                            <span className="font-semibold">مدة التسليم: </span>
                            {request.expected_delivery_days
                                ? request.expected_delivery_days === 1
                                    ? "يوم واحد"
                                    : `${request.expected_delivery_days} أيام`
                                : "-"}
                        </div>
                    </div>

                    <div className="text-xs text-gray-500">
                        <span className="font-semibold">التصنيف: </span>
                        {request.category?.name || "-"}
                        {request.subcategory?.name ? ` | ${request.subcategory.name}` : ""}
                    </div>
                </div>
            </div>
        </Link>
    );
}