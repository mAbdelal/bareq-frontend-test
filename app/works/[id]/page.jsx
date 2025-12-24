"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Loader from "@/components/ui/Loader";
import PageTitle from "@/components/ui/page-title";
import Avatar from "@/components/ui/Avatar";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import BackLink from "@/components/ui/back-link";

export default function WorkDetailsPage() {
    const { id } = useParams();
    const [work, setWork] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const { state } = useUser();

    useEffect(() => {
        async function fetchWork() {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/works/${id}`);
                if (res.ok) {
                    const json = await res.json();
                    setWork(json.data);
                } else {
                    setWork(null);
                }
            } catch (err) {
                console.error(err);
                setWork(null);
            } finally {
                setLoading(false);
            }
        }

        fetchWork();
    }, [id]);

    if (loading || state.user === undefined)
        return (
            <div className="flex justify-center items-center py-20">
                <Loader />
            </div>
        );
    if (!work)
        return (
            <div className="text-center py-20 text-gray-500">
                العمل غير موجود
            </div>
        );

    const user = work.user?.user;

    const imageAttachments = work.attachments?.filter(
        (att) => att.file_type === "cover" || att.file_type === "gallery_image"
    );
    const otherAttachments = work.attachments?.filter(
        (att) => att.file_type !== "cover" && att.file_type !== "gallery_image"
    );

    const handleDelete = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/works/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${state.token}`,
                },
            });

            if (res.ok) {
                toast.success("تم حذف العمل بنجاح");
                setOpenDeleteDialog(false);
                // redirect user if needed
                window.location.href = "/works";
            } else {
                const error = await res.json();
                toast.error(error.message || "فشل في حذف العمل");
            }
        } catch (err) {
            console.error(err);
            toast.error("حدث خطأ غير متوقع");
        }
    };

    return (
        <div className="pb-10 pt-12 px-4 md:px-6">

            <div className="mb-4">
                <BackLink href="/home">العودة للرئيسية</BackLink>
            </div>
            <PageTitle title={work.title} />

            <div className="flex flex-col lg:flex-row gap-6 mt-10">
                {/* Sidebar */}
                <aside className="w-full lg:w-1/4 flex flex-col items-center gap-4 bg-white shadow-lg rounded-2xl p-6 border border-gray-100 h-fit">
                    <Avatar
                        url={
                            user?.avatar
                                ? user.avatar.startsWith("http")
                                    ? user.avatar 
                                    : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${user.avatar}` 
                                : undefined
                        }
                        fallbackLetter={user?.first_name_ar?.charAt(0) || "؟"}
                        alt={user?.full_name_en || "User Avatar"}
                        size={96}
                        className="shadow-md"
                    />

                    <h4 className="font-bold text-lg md:text-xl mt-2 text-center text-gray-800">
                        {user?.first_name_ar} {user?.last_name_ar}
                    </h4>
                    <p className="text-sm text-gray-500 text-center">{user?.full_name_en}</p>

                    <div className="w-full bg-gray-50 rounded-xl shadow-inner p-5 mt-4 flex flex-col gap-3 border border-gray-100">
                        {work.category?.name && (
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-700">التصنيف الرئيسي:</span>
                                <span className="text-gray-800">{work.category.name}</span>
                            </div>
                        )}
                        {work.subcategory?.name && (
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-700">التصنيف الفرعي:</span>
                                <span className="text-gray-800">{work.subcategory.name}</span>
                            </div>
                        )}
                    </div>


                </aside>

                {/* Main Content */}
                <div className="w-full lg:w-3/4 flex flex-col gap-6">
                    {/* Image Attachments */}
                    {imageAttachments?.length ? (
                        <Carousel className="w-full relative" dir="ltr">
                            <CarouselContent>
                                {imageAttachments.map((att, idx) => (
                                    <CarouselItem key={att.id}>
                                        <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-md">
                                            <Image
                                                src={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${att.file_url}`}
                                                alt={att.file_name || `attachment-${idx}`}
                                                fill
                                                className="object-contain rounded-xl"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="absolute top-1/2 left-2 -translate-y-1/2 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow hover:bg-primary/80 z-10">
                                &#8249;
                            </CarouselPrevious>
                            <CarouselNext className="absolute top-1/2 right-2 -translate-y-1/2 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow hover:bg-primary/80 z-10">
                                &#8250;
                            </CarouselNext>
                        </Carousel>
                    ) : (
                        <div className="w-full h-80 bg-gray-200 flex items-center justify-center rounded-xl text-gray-500 font-medium">
                            لا توجد صور
                        </div>
                    )}

                    {/* Owner Actions */}
                    {state.user?.id === work.user_id && (
                        <div className="flex gap-3 mt-6">
                            <Link href={`/works/edit/${id}`}>
                                <Button variant="default" className="bg-primary hover:bg-blue-400">
                                    تعديل
                                </Button>
                            </Link>
                            <Button
                                variant="destructive"
                                onClick={() => setOpenDeleteDialog(true)}
                            >
                                حذف
                            </Button>
                        </div>
                    )}

                    {/* Other Attachments */}
                    {otherAttachments?.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-md">
                            <h3 className="text-lg font-bold mb-3 border-b pb-2">مرفقات إضافية</h3>
                            <ul className="list-disc list-inside space-y-2">
                                {otherAttachments.map((att) => (
                                    <li key={att.id}>
                                        <a
                                            href={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${att.file_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            {att.file_name || att.file_url}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="w-full bg-white rounded-2xl p-6 shadow-inner flex flex-col gap-6">
                        <h2 className="text-2xl font-bold border-b pb-2 mb-4">وصف العمل</h2>
                        <p className="text-gray-700 leading-relaxed">{work.description}</p>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent dir="rtl" className="text-right">
                    <DialogHeader>
                        <DialogTitle>تأكيد الحذف</DialogTitle>
                    </DialogHeader>
                    <p className="mt-2">هل أنت متأكد أنك تريد حذف هذا العمل؟ لا يمكن التراجع بعد الحذف.</p>
                    <DialogFooter className="mt-4 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
                            إلغاء
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            حذف
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
