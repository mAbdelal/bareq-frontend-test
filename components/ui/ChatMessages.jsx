import { useEffect, useRef } from "react";
import { Send, Paperclip } from "lucide-react";


const ChatMessages = ({ chatData, state }) => {
    if (!chatData) return null;

    const messages = chatData?.messages || [];
    const currentUserId = state.user.id;
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();

        const sameDay =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        const sameYear = date.getFullYear() === now.getFullYear();

        if (sameDay) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else if (sameYear) {
            return (
                date.toLocaleDateString([], { month: "short", day: "numeric" }) +
                " " +
                date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            );
        } else {
            return (
                date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }) +
                " " +
                date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            );
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-white rounded-t-xl overflow-y-auto w-full px-3">
            {/* scrollable messages box */}
            <div
                ref={messagesContainerRef}
                className="flex-1 p-3 sm:p-4 overflow-y-auto gap-3 flex flex-col"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-gray-400 mt-20">
                        <Send size={48} />
                        <p className="mt-2 text-sm">ابدأ المراسلة هنا</p>
                    </div>
                ) : (
                    messages.map((m) => {
                        const isCurrentUser = m.sender_id === currentUserId;

                        return (
                            <div
                                key={m.id}
                                className={`flex flex-col max-w-[80%] sm:max-w-md break-words ${!isCurrentUser ? "self-end items-end" : "self-start items-start"
                                    }`}
                            >
                                <div
                                    className={`py-2 px-3 text-sm sm:text-md rounded-2xl sm:rounded-3xl shadow-md ${isCurrentUser
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 text-label"
                                        }`}
                                >
                                    {m.content}

                                    {m.attachments?.length > 0 && (
                                        <div
                                            className={`${!m.content ? "mt-2" : "mt-3"
                                                } flex flex-col gap-1`}
                                        >
                                            {m.attachments.map((a) => (
                                                <a
                                                    key={a.id}
                                                    href={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/${a.file_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex items-center gap-2 underline text-sm transition-colors ${isCurrentUser
                                                            ? "text-white"
                                                            : "text-primary"
                                                        }`}
                                                >
                                                    <Paperclip size={16} />
                                                    <span>{a.file_name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 mt-1">
                                    {formatTime(m.created_at)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ChatMessages;
