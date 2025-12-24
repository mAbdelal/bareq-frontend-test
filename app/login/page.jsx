"use client";

import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import Loader from "@/components/ui/Loader";


export default function LoginPage() {
    const router = useRouter();
    const { state, dispatch } = useUser();
    const { user } = state;

    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [authChecking, setAuthChecking] = useState(true);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        if (state.user === undefined) return; // still loading

        setAuthChecking(false); // Set to false once we know the user state

        if (state.user !== null) {
            // User is logged in, redirect to home
            if (state.user.role) {
                router.replace("/admin/dashboard");
            } else {
                router.replace("/home");
            }
            return; // Don't proceed with rendering login form
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

            if (!res.ok) {
                dispatch({ type: "LOGOUT" });
                throw new Error(json.message || "فشل تسجيل الدخول");
            }

            if (json.data) {
                dispatch({ type: "LOGIN", payload: json.data });
            }

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

    // If user is logged in, don't render the login form at all
    // The useEffect above will have already triggered the redirect
    if (user !== null) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center p-4">
            {/* Image Section */}
            <div className="w-full lg:w-1/2 mb-8 lg:mb-0 hidden lg:block">
                <div className="flex justify-center">
                    <Image
                        src="/undraw_authentication_tbfc.svg"
                        alt="Login Illustration"
                        width={400}
                        height={400}
                        className="object-contain"
                    />
                </div>
            </div>
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center text-label">تسجيل الدخول</h2>

                {serverError && (
                    <p className="text-red-500 text-center mb-3">{serverError}</p>
                )}

                <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex flex-col">
                        <label htmlFor="email" className="mb-1 font-medium">البريد الالكتروني</label>
                        <input
                            id="email"
                            type="email"
                            {...register("email", { required: "البريد الالكتروني مطلوب" })}
                            className={`border rounded-lg p-2 focus:outline-none focus:ring-2 ${errors.email ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                            placeholder="example@email.com"
                        />
                        {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>}
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="password" className="mb-1 font-medium">كلمة المرور</label>
                        <input
                            id="password"
                            type="password"
                            {...register("password", { required: "كلمة المرور مطلوبة" })}
                            className={`border rounded-lg p-2 focus:outline-none focus:ring-2 ${errors.password ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-primary"}`}
                            placeholder="********"
                        />
                        {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password.message}</span>}
                    </div>

                    <div className="flex justify-end text-sm text-gray-600">
                        <Link href="/forgot-password" className="text-primary hover:underline">نسيت كلمة المرور؟</Link>
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

                <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/google`}
                >
                    <div className="flex items-center justify-center w-5 h-5">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 48 48"
                            className="w-5 h-5"
                        >
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.6l6.85-6.85C35.08 2.96 29.88 1 24 1 14.64 1 6.68 6.44 2.69 14.26l7.96 6.18C12.47 14.02 17.74 9.5 24 9.5z" />
                            <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.2-.43-4.73H24v9.02h12.43c-.55 2.95-2.2 5.45-4.7 7.13l7.24 5.63c4.24-3.91 6.63-9.66 6.63-16.05z" />
                            <path fill="#4A90E2" d="M9.05 28.44a14.5 14.5 0 0 1 0-8.87L1.09 13.4A23.942 23.942 0 0 0 0 24c0 3.89.93 7.58 2.59 10.86l7.46-6.42z" />
                            <path fill="#FBBC05" d="M24 47c6.48 0 11.92-2.13 15.89-5.83l-7.24-5.63c-2.03 1.36-4.63 2.16-8.65 2.16-6.26 0-11.53-4.52-13.35-10.63l-7.96 6.18C6.68 41.56 14.64 47 24 47z" />
                        </svg>

                    </div>
                    <span>تسجيل الدخول باستخدام Google</span>
                </Button>

                <p className="mt-6 text-center text-gray-600 text-sm">
                    ليس لديك حساب؟{" "}
                    <Link href="/register/academic" className="text-primary font-medium hover:underline">تسجيل حساب جديد</Link>
                </p>
            </div>
        </div>
    );
}
