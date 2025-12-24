import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function WorkCard({ work }) {
    const coverAttachment = work.attachments?.find(att => att.file_type === "cover");

    return (
        <Link href={`/works/${work.id}`} className="block">
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow mb-6 text-right">
                {coverAttachment && (
                    <div className="w-full h-40 md:h-60 relative overflow-hidden rounded-xl shadow-md">
                        <Image
                            src={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${coverAttachment.file_url}`}
                            alt={work.title}
                            fill
                            className="object-cover transition-transform duration-300 hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                        />
                    </div>
                )}

                <div className="p-4 md:p-6 flex flex-col gap-3">
                    <h3 className="font-bold text-lg md:text-xl">{work.title}</h3>
                    <p className="text-label text-sm md:text-base">{work.description}</p>

                    {/* Skills */}
                    {work.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 justify-start" dir="rtl">
                            {work.skills.map((skill, i) => (
                                <span
                                    key={i}
                                    className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs md:text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-label mt-2 justify-start" dir="rtl">
                        <span>التصنيف الرئيسي: {work.category?.name || "-"}</span>
                        <span>التصنيف الفرعي: {work.subcategory?.name || "-"}</span>
                    </div>

                    <div className="text-sm text-gray-400 mt-1">
                        تاريخ الإنجاز: {new Date(work.achievement_date).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </Link>
    );
}
