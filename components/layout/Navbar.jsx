"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/Container";
import { Briefcase, Layers, Users, LogOut, User, Home, Key, Menu, Bell, Megaphone } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useUser } from "@/context/UserContext";
import fetchWithAuth from "@/lib/api";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { state, dispatch } = useUser();
    const { user } = state;
    const [notifications, setNotifications] = useState([]);

    const [avatarOpen, setAvatarOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);


    const avatarRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const notifRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (avatarRef.current && !avatarRef.current.contains(event.target)) setAvatarOpen(false);
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) setMobileMenuOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch notifications
    useEffect(() => {
        if (!user) return;
        async function fetchNotifications() {
            try {
                const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/notifications/my`);
                const json = await res.json();
                setNotifications(json.data || []);
            } catch (err) {
                console.error(err);
            }
        }
        fetchNotifications();
    }, [user]);

    const handleLogout = async () => {
        try {
            await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/logout`, {
                method: "POST",
            });
            dispatch({ type: "LOGOUT" });
            router.push("/");
        } catch (err) {
            console.error(err);
        }
    };


    const markAsRead = async (id) => {
        try {
            await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/notifications/${id}/mark-as-read`, {
                method: "PATCH",
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/notifications/mark-as-read`, {
                method: "PATCH",
                credentials: "include",
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Hide Navbar entirely on admin routes
    if (pathname && pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <nav className="bg-background text-label w-full shadow-md fixed z-50 top-0">
            <Container className="px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                {/* Left: Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="text-primary text-2xl sm:text-3xl font-bold">بارق</div>
                </Link>

                {/* Center: Desktop Links */}
                <ul className="hidden md:flex items-center gap-8">
                    <li><Link href="/services" className="flex items-center gap-2 hover:text-hover-label font-bold"><Briefcase className="w-5 h-5" /> خدمات</Link></li>
                    <li><Link href="/requests" className="flex items-center gap-2 hover:text-hover-label font-bold"><Layers className="w-5 h-5" /> طلبات</Link></li>
                    <li><Link href="/academics" className="flex items-center gap-2 hover:text-hover-label font-bold"><Users className="w-5 h-5" /> أكاديميين</Link></li>
                </ul>

                {/* Right: Auth / Avatar / Notifications / Mobile Menu */}
                <div className="flex items-center gap-4">
                    {!user && (
                        <div className="flex items-center gap-4">
                            <Link href="/register/academic"><Button variant="outline">حساب جديد</Button></Link>
                            <Link href="/login"><Button variant="default">تسجيل دخول</Button></Link>
                        </div>
                    )}

                    {user && (
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <div className="relative" ref={notifRef}>
                                <Button
                                    variant="ghost"
                                    className="relative transition-transform duration-200 hover:scale-110 hover:text-primary"
                                    onClick={() => setNotifOpen(!notifOpen)}
                                >
                                    <Bell size={20}
                                        className={'transition-transform duration-300 text-label'}
                                    />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[11px]">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Button>


                                {notifOpen && (
                                    <div className="absolute -right-16 md:-right-36 lg:-right-28 mt-2 w-80 bg-white shadow-lg rounded-lg z-50 text-right max-h-96 overflow-y-auto">
                                        <div className="flex justify-between items-center px-4 py-2 border-b">
                                            <span className="font-bold text-gray-800">الإشعارات</span>
                                            <Button
                                                onClick={markAllAsRead}
                                                variant="outline"
                                                className="text-sm font-medium text-primary px-3 py-1 hover:bg-primary hover:text-white transition-all bg-white"
                                            >
                                                وضع الكل كمقروء
                                            </Button>
                                        </div>

                                        {notifications.length === 0 && <p className="px-4 py-2 text-sm text-gray-500">لا توجد إشعارات</p>}
                                        {notifications.map(n => (
                                            <div
                                                key={n.id}
                                                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${n.read ? 'bg-gray-50' : 'bg-white font-semibold'}`}
                                                onClick={() => {
                                                    markAsRead(n.id);
                                                    if (n.link) router.push(n.link);
                                                }}
                                            >
                                                {n.message}
                                                <span className="block text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Avatar */}
                            <div className="relative block" ref={avatarRef}>
                                <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setAvatarOpen(!avatarOpen)}>
                                    <Avatar
                                        url={
                                            user.avatar
                                                ? user.avatar.startsWith("http") 
                                                    ? user.avatar
                                                    : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${user.avatar}`
                                                : null
                                        }
                                        fallbackLetter={user.first_name_ar?.charAt(0) || "U"}
                                        size={35}
                                        className="border"
                                    />

                                    <span className="font-medium">{user.first_name_ar} {user.last_name_ar}</span>
                                </div>

                                {avatarOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg z-50 text-right">
                                        <Link href="/home" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100"><Home className="w-5 h-5" /> الصفحة الرئيسية</Link>
                                        <Link href="/change-password" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100"><Key className="w-5 h-5" /> تغيير كلمة المرور</Link>
                                        <div onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 cursor-pointer"><LogOut className="w-5 h-5" /> تسجيل الخروج</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile Hamburger */}
                    <div className="md:hidden relative" ref={mobileMenuRef}>
                        <Button variant="ghost" size="lg" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <Menu className="w-7 h-7" />
                        </Button>
                        {mobileMenuOpen && (
                            <div className="absolute top-full -right-45 mt-2 w-56 bg-white shadow-lg rounded-lg text-right z-50">
                                <Link href="/services" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100"><Briefcase className="w-5 h-5" /> خدمات</Link>
                                <Link href="/requests" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100"><Layers className="w-5 h-5" /> طلبات</Link>
                                <Link href="/academics" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100"><Users className="w-5 h-5" /> أكاديميين</Link>
                                <Link href="/complaints" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100"><Megaphone className="w-5 h-5" /> الشكاوى</Link>
                                <Link href="/home" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100"><User className="w-5 h-5" /> الملف الشخصي</Link>
                                <Link href="/profile/change-password" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100"><Key className="w-5 h-5" /> تغيير كلمة المرور</Link>
                                <div onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 cursor-pointer"><LogOut className="w-5 h-5" /> تسجيل الخروج</div>
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </nav>
    );
}
