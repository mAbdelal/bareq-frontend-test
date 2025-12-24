"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ShoppingCart,
    Package,
    Plus,
    FileText,
    Briefcase,
    Layers,
    Users,
    CreditCard,
    HandCoins,
    Gavel
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/Avatar";
import Loader from "@/components/ui/Loader";
import PageTitle from "@/components/ui/page-title";
import { useUser } from "@/context/UserContext";
import fetchWithAuth from "@/lib/api";
import { toast } from "sonner";


export const dynamic = 'force-dynamic';

export default function DashboardPage() {
    const router = useRouter();
    const { state } = useUser();

    const [user, setUser] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);

    useEffect(() => {
        if (state.user === undefined) return; // still loading

        // Only redirect to login if explicitly logged out (null)
        if (state.user === null) {
            router.replace("/login");
            return;
        }

        // User is logged in, proceed to fetch their data
        setAuthChecking(false);
    }, [state.user, router]);

    useEffect(() => {
        if (authChecking || !state.user) return;

        const fetchUser = async () => {
            try {
                const res = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/me/profile`,
                    { headers: { "Content-Type": "application/json" } }
                );
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "فشل تحميل البيانات");
                setUser(json.data);
            } catch (err) {
                console.error("Error fetching user:", err);
                // Only redirect to login on actual auth failures, not on data fetch errors
                // User is still logged in, show error but don't redirect
                toast.error(err.message || "فشل تحميل بيانات المستخدم");
            }
        };
        fetchUser();
    }, [authChecking, state.user, router]);

    if (authChecking || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 ">

            <PageTitle
                title="لوحة التحكم"
                paragraph={`مرحبًا بك، ${user.user.first_name_ar} ${user.user.last_name_ar}`}
                className="mb-0"
            />

            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Panel */}
                <div className="w-full md:w-1/4 flex flex-col gap-4">
                    {/* Avatar Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center gap-4">
                        <Avatar
                            url={
                                user?.user?.avatar
                                    ? user.user.avatar.startsWith("http")
                                        ? user.user.avatar
                                        : `${process.env.NEXT_PUBLIC_BASE_URL}/assets/${user.user.avatar}`
                                    : null
                            }
                            fallbackLetter={user?.user?.first_name_ar?.charAt(0) || "U"}
                            size={80}
                            className="border"
                        />

                        <h2 className="text-xl font-bold text-center">
                            {user.user.first_name_ar} {user.user.last_name_ar}
                        </h2>
                        <Link
                            href="/academics/profile"
                            className="text-primary underline hover:text-primary/80"
                        >
                            الملف الشخصي
                        </Link>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="p-4 flex flex-col gap-3">
                        <Link href="/my-works">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <Briefcase size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    اعمالي
                                </span>
                            </Button>
                        </Link>

                        <Link href="/my-requests">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <Layers size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    طلباتي
                                </span>
                            </Button>
                        </Link>

                        <Link href="/my-services">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <Users size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    خدماتي
                                </span>
                            </Button>
                        </Link>

                        <Link href="/my-offers">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <HandCoins size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    عروضي
                                </span>
                            </Button>
                        </Link>

                        <Link href="/my-purchases">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <CreditCard size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    مشترياتي
                                </span>
                            </Button>
                        </Link>

                        <Link href="/my-disputes">
                            <Button className="w-full flex items-center justify-start gap-3">
                                <Gavel size={24} />
                                <span className="flex-1 text-right text-md font-semibold">
                                    نزاعاتي
                                </span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-full md:w-3/4 flex flex-col gap-6 mx-auto">
                    {/* Balance Cards */}
                    <div className="flex justify-center">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
                            <div className="bg-white rounded-2xl shadow-md p-6 text-center flex flex-col items-center gap-2">
                                <span className="text-gray-500 font-medium">الرصيد الكلي</span>
                                <span className="text-3xl font-bold">{user.balance || 0} $</span>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-6 text-center flex flex-col items-center gap-2">
                                <span className="text-gray-500 font-medium">الرصيد المعلق</span>
                                <span className="text-3xl font-bold">
                                    {user.frozen_balance || 0} $
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 p-2">
                        <Link href="/services/add" className="flex-1">
                            <Button className="w-full flex items-center justify-center gap-2 text-lg">
                                <Plus /> اضافة خدمة
                            </Button>
                        </Link>

                        <Link href="/requests/add" className="flex-1">
                            <Button className="w-full flex items-center justify-center gap-2 text-lg">
                                <Plus /> اضافة طلب
                            </Button>
                        </Link>

                        <Link href="/works/add" className="flex-1">
                            <Button className="w-full flex items-center justify-center gap-2 text-lg">
                                <Plus /> اضافة عمل
                            </Button>
                        </Link>
                    </div>


                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 hover:shadow-xl transition-transform hover:scale-[1.02]">
                            <div className="flex items-center gap-2 text-primary font-bold text-2xl">
                                <ShoppingCart className="w-6 h-6" /> مشترياتي
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-2 text-center">
                                <div className="p-3 rounded-xl bg-blue-50 flex flex-col items-center">
                                    <span className="text-sm text-gray-600">قيد التنفيذ</span>
                                    <span className="text-lg font-bold text-primary">
                                        {user.purchases_summary?.as_buyer?.in_progress || 0}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-50 flex flex-col items-center">
                                    <span className="text-sm text-gray-600">مكتمل</span>
                                    <span className="text-lg font-bold text-primary">
                                        {user.purchases_summary?.as_buyer?.completed || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* مبيعاتي */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 hover:shadow-xl transition-transform hover:scale-[1.02]">
                            <div className="flex items-center gap-2 text-primary font-bold text-2xl">
                                <Package className="w-6 h-6" /> مبيعاتي
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-2 text-center">
                                <div className="p-3 rounded-xl bg-blue-50 flex flex-col items-center">
                                    <span className="text-sm text-gray-600">قيد التنفيذ</span>
                                    <span className="text-lg font-bold text-primary">
                                        {user.purchases_summary?.as_provider?.in_progress || 0}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-50 flex flex-col items-center">
                                    <span className="text-sm text-gray-600">مكتمل</span>
                                    <span className="text-lg font-bold text-primary">
                                        {user.purchases_summary?.as_provider?.completed || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 hover:shadow-xl transition-transform hover:scale-[1.02]">
                            <div className="flex items-center gap-2 text-primary font-bold text-2xl">
                                <FileText className="w-6 h-6" /> عروضي
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-2 text-center">
                                <div className="p-3 rounded-xl bg-blue-50 flex flex-col items-center">
                                    <span className="text-sm text-gray-600">قيد التنفيذ</span>
                                    <span className="text-lg font-bold text-primary">
                                        {user.offers_summary?.in_progress || 0}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-50 flex flex-col items-center">
                                    <span className="text-sm text-gray-600">مكتمل</span>
                                    <span className="text-lg font-bold text-primary">
                                        {user.offers_summary?.done || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
