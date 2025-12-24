"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import fetchWithAuth from "@/lib/api";
import { Paperclip, Star, Send } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import PageTitle from "@/components/ui/page-title";
import ChatMessages from "@/components/ui/ChatMessages";
import BackLink from "@/components/ui/back-link";
import { initSocket } from "@/lib/socket";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ChatPageContent() {
    const { type, id: parmId } = useParams();
    const router = useRouter();
    const { state } = useUser();
    const searchParams = useSearchParams();

    const inputRef = useRef(null);
    const messagesBoxRef = useRef(null);

    const [chatData, setChatData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authChecking, setAuthChecking] = useState(true);
    const [message, setMessage] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [sending, setSending] = useState(false);

    const isAdmin = state.user?.role ? true : false;
    const id = parmId?.[0];

    // scroll to input once after page is loaded
    useEffect(() => {
        if (!loading && !authChecking) {
            if (inputRef.current) {
                inputRef.current.focus();
            }
            if (messagesBoxRef.current) {
                messagesBoxRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
            }
        }
    }, [loading, authChecking]);

    // Fetch chat
    useEffect(() => {
        const fetchChat = async () => {
            try {
                let res;
                if (type === "negotiation") {

                    const service_id = searchParams.get("service_id");
                    const buyer_id = searchParams.get("buyer_id");
                    const provider_id = searchParams.get("provider_id");

                    if (!service_id || !buyer_id || !provider_id) {
                        throw new Error("Missing negotiation parameters in query");
                    }
                    const body = {
                        service_id,
                        buyer_id,
                        provider_id,
                    };
                    res = await fetchWithAuth(
                        `${process.env.NEXT_PUBLIC_BASE_URL}/chats/negotiation`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                        }
                    );
                } else {
                    res = await fetchWithAuth(
                        `${process.env.NEXT_PUBLIC_BASE_URL}/chats/${type}/${id}`
                    );
                }

                const data = await res.json();
                const chat = data.data;

                // Redirect negotiation → purchase if a purchase exists
                if (type === "negotiation" && chat.service_purchase_id) {
                    router.replace(`/chats/purchase/${chat.service_purchase_id}`, undefined, { shallow: true });
                }

                setChatData(chat);
            } catch (err) {
                toast.error("فشل تحميل المحادثة");
            } finally {
                setLoading(false);
            }
        };

        fetchChat();
    }, [type, parmId, router]);

    useEffect(() => {
        const socket = initSocket();

        // Join the chat room
        if (chatData?.id) {
            socket.emit("join-chat", { chat_id: chatData.id });
        }

        socket.on("new-message", (message) => {
            setChatData((prev) => ({
                ...prev,
                messages: [...(prev.messages || []), message],
            }));
        });

        return () => {
            if (chatData?.id) {
                socket.emit("leave-chat", { chat_id: chatData.id });
            }
            socket.off("new-message");
        };
    }, [chatData?.id]);


    // Auth check
    useEffect(() => {
        if (state.user === undefined) return;
        if (state.user === null) router.replace("/login");
        else setAuthChecking(false);
    }, [state.user, router]);


    // Send message
    const handleSendMessage = async () => {
        if (!message && attachments.length === 0) return;
        try {
            setSending(true);
            const formData = new FormData();
            formData.append("content", message);
            attachments.forEach((file) => formData.append("files", file));

            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/chats/${chatData.id}/messages`, {
                method: "POST",
                body: formData,
            });
            const json = await res.json();
            if (!res.ok) throw new Error("فشل إرسال الرسالة");

            setChatData((prev) => ({
                ...prev,
                messages: [...(prev.messages || []), json.data],
            }));

            setMessage("");
            setAttachments([]);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSending(false);
        }
    };

    if (authChecking || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader />
            </div>
        );
    }


    return (

        <div className="h-screen flex flex-col pb-10">
            <div className="p-4 mt-5">
                <BackLink href="/home">العودة للرئيسية</BackLink>
            </div>

            <div className="p-4">
                <PageTitle title="مراسلة" className="h-fit" />
            </div>
            <div className="flex flex-1 overflow-hidden -mt-9 flex-col md:flex-row ">


                {/* Sidebar */}
                <div className="w-full md:w-1/4 p-4 overflow-y-auto">
                    <Sidebar
                        chatData={chatData}
                        router={router}
                        state={state}
                        type={type}
                        isAdmin={isAdmin}
                        offerId={id}
                    />
                </div>

                {/* Chat area */}
                <div className="w-full md:w-3/4 flex flex-col justify-between">
                    <ChatMessages chatData={chatData} state={state} />

                    {!isAdmin && (
                        <>
                            <div className="p-4 bg-white flex flex-col gap-2 rounded-t-xl shadow-inner">
                                <div className="flex flex-col sm:flex-row items-center gap-2">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="اكتب رسالتك..."
                                        ref={inputRef}
                                        className="flex-1 border rounded-xl p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => setAttachments(Array.from(e.target.files))}
                                            className="hidden"
                                            id="attachments"
                                        />
                                        <label
                                            htmlFor="attachments"
                                            className="cursor-pointer p-3 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
                                        >
                                            <Paperclip size={20} />
                                        </label>
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={sending}
                                            className="bg-primary hover:bg-blue-400 text-white px-4 py-2 rounded-xl disabled:opacity-50 transition"
                                        >
                                            إرسال
                                        </button>
                                    </div>
                                </div>

                                {/* Attachment preview */}
                                {attachments.length > 0 && (
                                    <div className="flex flex-col mt-2 gap-1">
                                        {attachments.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between bg-gray-100 p-2 rounded-xl"
                                            >
                                                <span className="truncate text-sm">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAttachments((prev) =>
                                                            prev.filter((_, i) => i !== index)
                                                        )
                                                    }
                                                    className="text-red-500 text-sm hover:underline"
                                                >
                                                    حذف
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div ref={messagesBoxRef}></div>
                        </>
                    )}
                </div>
            </div>
        </div>

    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50"><Loader /></div>}>
            <ChatPageContent />
        </Suspense>
    );
}

function Sidebar({ chatData, router, state, type, isAdmin, offerId }) {
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [acceptOfferLoading, setAcceptOfferLoading] = useState(false);
    if (!chatData) return null;

    const currentUserId = state.user.id;

    const handlePurchase = async () => {
        try {
            setPurchaseLoading(true);
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/purchases`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ service_id: chatData.service_id })
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error("فشل إتمام عملية الشراء");
            } else {
                toast.success("تم الشراء بنجاح");
                router.push(`/purchases/${json.data.id}`);
            }

        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء الشراء");
        } finally {
            setPurchaseLoading(false);
        }
    };

    const handleAcceptOffer = async () => {
        try {
            setAcceptOfferLoading(true);

            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/requests/${chatData.request_id}/offers/${offerId}/accept`, {
                method: "PATCH",
            });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json.message || "حدث خطأ أثناء قبول العرض");
            } else {
                toast.success("تم قبول العرض بنجاح");
                router.push(`/requests/private/${chatData.request_id}`);
            }
        } catch (err) {
            toast.error(err.message || "حدث خطأ أثناء قبول العرض");
        } finally {
            setAcceptOfferLoading(false);
        }
    };

    if (isAdmin) {
        const users = [chatData.firstPart, chatData.secondPart];
        return (
            <div className="space-y-6">
                {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md">
                        <Link href={`/academics/profile/${user.id}`} className="hover:opacity-80 transition">
                            <Avatar
                                url={
                                    user?.avatar
                                        ? user.avatar.startsWith("http")
                                            ? user.avatar // Google or any external URL
                                            : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${user.avatar}` // Local uploads
                                        : null
                                }
                                fallbackLetter={user?.first_name_ar?.charAt(0)?.toUpperCase() || "U"}
                                alt={user?.first_name_ar || "User Avatar"}
                                size={48}
                            />

                        </Link>
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">
                                {user?.first_name_ar} {user?.last_name_ar}
                            </span>
                            <span className="flex items-center gap-1 text-yellow-500 text-sm">
                                <Star size={14} /> {user?.rating || 0} ({user?.rating_count || 0})
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const otherUser = currentUserId === chatData.firstPart.id ? chatData.secondPart : chatData.firstPart;

    return (
        <div className="space-y-6">
            {type === "negotiation" && !chatData.service_purchase_id && chatData.buyer_id === currentUserId && (
                <Button
                    variant="default"
                    className="w-full bg-primary hover:bg-blue-400 transition-colors"
                    onClick={handlePurchase}
                    disabled={purchaseLoading}
                >
                    {purchaseLoading ? "جاري الشراء..." : "شراء الخدمة"}
                </Button>
            )}
            {type === "offer" && !chatData.accepted_offer_id && chatData.requester_id === currentUserId && (
                <Button
                    variant="default"
                    className="w-full bg-primary hover:bg-blue-400 transition-colors"
                    onClick={handleAcceptOffer}
                    disabled={acceptOfferLoading}
                >
                    {acceptOfferLoading ? "جاري القبول..." : "قبول العرض"}
                </Button>
            )}

            <div className="p-4 bg-white rounded-xl shadow-md space-y-2">
                <h2 className="text-gray-700 font-semibold text-sm">
                    مراسلة بخصوص:{" "}
                    {type === "general"
                        ? "عام"
                        : type === "offer"
                            ? <Link href={chatData.provider_id === currentUserId ? `/requests/${chatData.request_id}` : `/requests/private/${chatData.request_id}`} className="text-primary underline hover:text-primary/80">عرض</Link>
                            : type === "negotiation"
                                ? <Link href={chatData.buyer_id === currentUserId ? `/services/${chatData.service_id}` : `/services/private/${chatData.service_id}`} className="text-primary underline hover:text-primary/80">تفاوض</Link>
                                : type === "purchase"
                                    ? <Link href={`/purchases/${chatData.service_purchase_id}`} className="text-primary underline hover:text-primary/80">شراء خدمة</Link>
                                    : null
                    }
                </h2>

                <div className="flex flex-col items-center gap-5 mt-4">
                    <Link href={`/academics/profile/${otherUser.id}`} className="hover:opacity-80 transition">
                        <Avatar
                            url={
                                otherUser?.avatar
                                    ? otherUser.avatar.startsWith("http")
                                        ? otherUser.avatar // external URL (like Google)
                                        : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${otherUser.avatar}` // local uploads
                                    : null
                            }
                            fallbackLetter={otherUser?.first_name_ar?.charAt(0)?.toUpperCase() || "U"}
                            alt={otherUser?.first_name_ar || "Other User Avatar"}
                            size={48}
                        />

                    </Link>
                    <div className="flex flex-col gap-3">
                        <span className="font-semibold text-gray-800">
                            {otherUser?.first_name_ar} {otherUser?.last_name_ar}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-500 text-sm">
                            <Star size={14} /> {otherUser?.rating || 0} ({otherUser?.rating_count || 0})
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
