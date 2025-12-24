"use client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import Loader from "@/components/ui/Loader";

export default function AdminLoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: "", password: "" }
  });

  const [error, setError] = useState("");

  const { state, dispatch } = useUser();

  useEffect(() => {
    if (state.user === undefined) return; // Still loading user data

    if (state.user !== null) {
      if (state.user.role) {
        // Redirect admin to dashboard
        router.replace("/admin/dashboard");
      } else {
        // Redirect non-admin users to home
        router.replace("/home");
      }
    }
    // No action needed if user is null (not logged in)
  }, [state.user, router]);


  const onSubmit = async (data) => {
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "فشل تسجيل الدخول");
      }

      if (json.data) {
        if (!json.data.role) {
          throw new Error("غير مصرح لك بالدخول كأدمن");
        }
        dispatch({ type: "LOGIN", payload: json.data });
        router.push("/admin/dashboard");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (state.user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-2 text-center">تسجيل دخول الأدمن</h1>
        {error && <p className="text-red-500 mb-3 text-center">{error}</p>}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" aria-invalid={errors.email ? true : undefined} {...register("email", { required: "مطلوب" })} />
            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" type="password" aria-invalid={errors.password ? true : undefined} {...register("password", { required: "مطلوب" })} />
            {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
          </div>
          <Button type="submit" className="bg-primary text-white py-2 rounded" disabled={isSubmitting}>
            {isSubmitting ? "جاري الدخول..." : "دخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
