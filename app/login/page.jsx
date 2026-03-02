"use client";

import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import Loader from "@/components/ui/Loader";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import BackLink from "@/components/ui/back-link";

export default function LoginPage() {
    const router = useRouter();
    const { state, dispatch } = useUser();
    const { user } = state;

    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [authChecking, setAuthChecking] = useState(true);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { identifier: "", password: "" },
    });

    useEffect(() => {
        if (state.user === undefined) return;
        setAuthChecking(false);

        if (state.user !== null) {
            router.replace(state.user.role ? "/admin/dashboard" : "/home");
        }
    }, [state.user, router]);

    const onSubmit = async (data) => {
        setLoading(true);
        setServerError("");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "فشل تسجيل الدخول");

            if (json.data) dispatch({ type: "LOGIN", payload: json.data });
            router.push("/home");
        } catch (err) {
            setServerError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async (credentialResponse) => {
        setLoading(true);
        setServerError("");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: credentialResponse.credential }),
                credentials: "include",
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "فشل تسجيل الدخول باستخدام Google");

            if (json.data) dispatch({ type: "LOGIN", payload: json.data });
            router.push("/home");
        } catch (err) {
            setServerError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authChecking) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    if (user !== null) return null;

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
            <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center p-4 gap-6">

                <div className="w-full lg:hidden mb-4">
                    <BackLink href="/">العودة للرئيسية</BackLink>
                </div>

                <div className="w-full lg:w-1/2 mb-8 lg:mb-0 hidden lg:flex flex-col items-start">
                    <BackLink href="/">العودة للرئيسية</BackLink>
                    <div className="flex justify-center w-full mt-6">
                        <Image
                            src="/undraw_authentication_tbfc.svg"
                            alt="Login Illustration"
                            width={400}
                            height={400}
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* Login Card */}
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-center text-label">
                        تسجيل الدخول
                    </h2>

                    {serverError && (
                        <p className="text-red-500 text-center mb-3">{serverError}</p>
                    )}

                    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                        {/* Email OR Username */}
                        <div className="flex flex-col">
                            <label htmlFor="identifier" className="mb-1 font-medium">
                                البريد الإلكتروني أو اسم المستخدم
                            </label>
                            <input
                                id="identifier"
                                type="text"
                                {...register("identifier", { required: "البريد الإلكتروني أو اسم المستخدم مطلوب" })}
                                className={`border rounded-lg p-2 focus:outline-none focus:ring-2 ${errors.identifier ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                            />
                            {errors.identifier && (
                                <span className="text-red-500 text-sm mt-1">{errors.identifier.message}</span>
                            )}
                        </div>

                        {/* Password */}
                        <div className="flex flex-col">
                            <label htmlFor="password" className="mb-1 font-medium">
                                كلمة المرور
                            </label>
                            <input
                                id="password"
                                type="password"
                                {...register("password", { required: "كلمة المرور مطلوبة" })}
                                className={`border rounded-lg p-2 focus:outline-none focus:ring-2 ${errors.password ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                            />
                            {errors.password && (
                                <span className="text-red-500 text-sm mt-1">{errors.password.message}</span>
                            )}
                        </div>

                        <div className="flex justify-end text-sm text-gray-600">
                            <Link href="/forgot-password" className="text-primary hover:underline">
                                نسيت كلمة المرور؟
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className={`bg-primary text-white py-2 rounded-lg shadow hover:bg-primary/80 transition ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                            disabled={loading}
                        >
                            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">أو</span>
                        </div>
                    </div>

                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => setServerError("فشل تسجيل الدخول باستخدام Google")}
                    />

                    <p className="mt-6 text-center text-gray-600 text-sm">
                        ليس لديك حساب؟{" "}
                        <Link href="/register/academic" className="text-primary font-medium hover:underline">
                            تسجيل حساب جديد
                        </Link>
                    </p>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}
