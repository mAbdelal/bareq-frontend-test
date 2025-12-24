import Avatar from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import {translateAcademicStatus} from "@/lib/translations";


export default function AcademicCard({ acad }) {
    // Prepare avatar URL and fallback letter
    const avatarUrl = acad.user?.avatar
        ? acad.user.avatar.startsWith("http")
            ? acad.user.avatar 
            : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${acad.user.avatar}` 
        : undefined;


    const fallbackLetter = acad.user?.first_name_ar
        ? acad.user.first_name_ar.charAt(0)
        : "؟";

    return (
        <div className="bg-white shadow-md rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow w-full">
            {/* Header: Avatar + Name + Rating */}
            <div className="flex flex-col items-center">
                <Avatar
                    url={avatarUrl}
                    fallbackLetter={fallbackLetter}
                    alt={`${acad.user?.first_name_ar ?? ""} ${acad.user?.last_name_ar ?? ""}`}
                    size={64} // Adjust size as needed
                    className="mb-2"
                />

                <h4 className="font-bold text-lg text-gray-800">
                    {acad.user?.first_name_ar && acad.user?.last_name_ar
                        ? `${acad.user.first_name_ar} ${acad.user.last_name_ar}`
                        : "اسم غير متوفر"}
                </h4>

                {/* Rating */}
                <div className="flex items-center gap-1 text-sm text-yellow-500 mt-1">
                    ★ {acad.rating ?? 0}{" "}
                    <span className="text-gray-500">({acad.ratings_count ?? 0})</span>
                </div>
            </div>

            {/* Job Title Centered */}
            <p className="text-sm text-gray-600 mt-3">
                {acad.job_title && acad.job_title.trim() !== ""
                    ? acad.job_title
                    : "لا يوجد مسمى وظيفي"}
            </p>

            {/* Academic Status Badge */}
            <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full mt-2">
                {translateAcademicStatus(acad.academic_status)}
            </span>

            {/* University & Major */}
            <div className="mt-3 text-sm text-gray-700 space-y-1">
                <p>
                    <span className="font-semibold">الجامعة:</span>{" "}
                    {acad.university && acad.university.trim() !== "" ? acad.university : "غير محدد"}
                </p>
                <p>
                    <span className="font-semibold">التخصص:</span>{" "}
                    {acad.major && acad.major.trim() !== "" ? acad.major : "غير محدد"}
                </p>
            </div>

            {/* Action Button */}
            <Button
                variant="link"
                className="mt-4 text-primary"
                onClick={() => (window.location.href = `academics/profile/${acad.user_id}`)}
            >
                عرض الملف الشخصي
            </Button>
        </div>
    );
}