"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import fetchWithAuth from "@/lib/api";
import { X, Upload } from "lucide-react";

export default function MakeOfferDialog({ request, setRequest, setOffers, user, router }) {
    const [open, setOpen] = useState(false);
    const [price, setPrice] = useState("");
    const [deliveryDays, setDeliveryDays] = useState("");
    const [message, setMessage] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);

    // Handle file uploads
    const handleFileChange = (e) => {
        if (!e.target.files) return;
        const filesArray = Array.from(e.target.files).map((file) => ({
            filename: file.name,
            file_type: "general",
            file,
        }));
        setAttachments((prev) => [...prev, ...filesArray]);
    };

    const removeAttachment = (idx) => {
        setAttachments((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!price || !deliveryDays || !message) {
            toast.error("الرجاء ملء جميع الحقول المطلوبة");
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("price", price);
            formData.append("delivery_days", deliveryDays);
            formData.append("message", message);

            if (attachments.length > 0) {
                formData.append(
                    "attachments_meta",
                    JSON.stringify(
                        attachments.map((a) => ({ filename: a.filename, file_type: a.file_type }))
                    )
                );
                attachments.forEach((a) => {
                    if (a.file) formData.append("files", a.file);
                });
            }

            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_BASE_URL}/requests/${request.id}/offers`,
                { method: "POST", body: formData }
            );

            const json = await res.json();

            if (!res.ok) {
                toast.error(json?.message || "حدث خطأ أثناء تقديم العرض");
            } else {
                toast.success("تم تقديم العرض بنجاح!");

                // Prepare attachments for optimistic update
                const attachmentsArray = attachments.map((a) => ({
                    file_url: a.file ? URL.createObjectURL(a.file) : "",
                    file_name: a.filename,
                    file_type: a.file_type,
                }));

                const newOffer = {
                    id: "temp-" + Date.now(),
                    provider_id: user.id,
                    price: parseFloat(price),
                    delivery_days: parseInt(deliveryDays),
                    message,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    provider: {
                        user: {
                            full_name_en: user.full_name_en || "",
                            first_name_ar: user.first_name_ar || "",
                            last_name_ar: user.last_name_ar || "",
                            avatar: user.avatar || null,
                        },
                    },
                    attachments: attachmentsArray,
                };

                setRequest({
                    ...request,
                    offers: [...(request.offers || []), newOffer],
                });

                setOffers([...(request.offers || []), newOffer]);
            }

            // Reset form
            setOpen(false);
            setPrice("");
            setDeliveryDays("");
            setMessage("");
            setAttachments([]);
        } catch (err) {
            toast.error(err?.message || "حدث خطأ أثناء تقديم العرض");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {user ? (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="default" size="sm" onClick={() => setOpen(true)}>
                            تقديم عرض
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>تقديم عرض جديد</DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-6 py-4">
                            <div className="grid gap-1">
                                <Label htmlFor="price" className="font-bold">السعر</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label htmlFor="delivery" className="font-bold">عدد أيام التسليم</Label>
                                <Input
                                    id="delivery"
                                    type="number"
                                    value={deliveryDays}
                                    onChange={(e) => setDeliveryDays(e.target.value)}
                                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label htmlFor="message" className="font-bold">الرسالة</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={3}
                                    className="border-gray-600 focus:border-gray-800 focus:ring-gray-800"
                                />
                            </div>

                            {/* Attachments uploader */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-xl font-semibold">مرفقات (اختياري)</Label>
                                <label
                                    htmlFor="attachments"
                                    className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                    <p className="text-lg text-gray-600">اضغط لرفع ملفات جديدة</p>
                                    <Input
                                        id="attachments"
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>

                                {attachments.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {attachments.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 shadow-sm"
                                            >
                                                <span className="text-lg font-medium truncate">{file.filename}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeAttachment(idx)}
                                                >
                                                    <X className="w-5 h-5 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? "جاري الإرسال..." : "إرسال العرض"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : (
                // If not logged in, show a simple button that redirects immediately
                <Button variant="default" size="sm" onClick={() => router.push("/login")}>
                    تقديم عرض
                </Button>
            )}
        </>
    );
}
