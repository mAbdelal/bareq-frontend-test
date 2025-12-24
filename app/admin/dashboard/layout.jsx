"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/button";
import fetchWithAuth from "@/lib/api";

function linkCls(href, pathname) {
  return `px-3 py-1 rounded-md text-lg font-medium mr-7 ${pathname === href ? "bg-primary text-white" : "text-label hover:bg-gray-200"
    }`;
}

export default function AdminDashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, dispatch } = useUser();
  const [authChecking, setAuthChecking] = useState(true);

  // --- Auth Check ---
  useEffect(() => {
    if (state.user === undefined) return;

    if (state.user === null) {
      router.replace("/admin/login");
    } else if (!state.user.role) {
      router.replace("/home");
    } else {
      setAuthChecking(false);
    }
  }, [state.user, router]);

  const handleLogout = async () => {
    await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/logout`, {
      method: "POST",
    });
    dispatch({ type: "LOGOUT" });
    router.replace("/admin/login");
  };

  if (authChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }


  const sidebarLinks = {
    general: [
      { label: "الرئيسية", href: "/admin/dashboard" },
    ],

    account: [
      { label: "تغيير كلمة المرور", href: "/admin/dashboard/change-password" },
      { label: "تعديل بيانات الأدمن", href: "/admin/dashboard/edit-profile" },
    ],

    platform: [
      { label: "المستخدمين", href: "/admin/dashboard/users" },
      { label: "الطلبات", href: "/admin/dashboard/requests" },
      { label: "الشراءات", href: "/admin/dashboard/purchases" },
      { label: " النزاعات", href: "/admin/dashboard/disputes" },
      { label: "التحويلات المالية", href: "/admin/dashboard/transactions" },
      { label: "الشكاوى", href: "/admin/dashboard/complaints" },
    ],

    admin_management: [
      { label: "تسجيل مشرف جديد", href: "/admin/dashboard/register-admin" },
      { label: "المشرفين", href: "/admin/dashboard/all-admins" },
      { label: "الأدوار", href: "/admin/dashboard/roles" },
      { label: " الصلاحيات", href: "/admin/dashboard/permissions" },
      { label: " صلاحيات الأدوار", href: "/admin/dashboard/role-permissions" },
    ],
  };

  const role = state.user?.role;

  let visibleSections = [];

  if (role === "SuperAdmin") {
    visibleSections = ["general", "account", "platform", "admin_management"];
  } else if (role === "Moderator") {
    visibleSections = ["general", "account", "platform"];
  } else if (role === "SupportAdmin") {
    visibleSections = ["general", "account", "platform"];
  }

  return (
    <div className="min-h-screen mb-4">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-5">
          <div className="text-3xl font-bold">لوحة تحكم الأدمن</div>
          <span className="text-sm text-gray-500">
            {role === "SuperAdmin" && "صلاحية كاملة"}
            {role === "Moderator" && "مشرف محتوى"}
            {role === "SupportAdmin" && "دعم فني"}
          </span>
        </div>
        <Button
          variant={"destructive"}
          onClick={handleLogout}
          className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm"
        >
          تسجيل الخروج
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-l rounded-2xl p-4 mt-5 shadow-sm">
          <nav className="flex flex-col gap-1">
            {/* Render Each Visible Section Dynamically */}
            {visibleSections.includes("general") && (
              <>
                <div className="text-sm text-gray-500 px-2">عام</div>
                {sidebarLinks.general.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={linkCls(link.href, pathname)}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}



            {visibleSections.includes("platform") && (
              <>
                <div className="text-sm text-gray-500 px-2 mt-4">
                  إدارة المنصة
                </div>
                {sidebarLinks.platform.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={linkCls(link.href, pathname)}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}

            {visibleSections.includes("admin_management") && (
              <>
                <div className="text-sm text-gray-500 px-2 mt-4">
                  إدارة المشرفين و الصلاحيات
                </div>
                {sidebarLinks.admin_management.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={linkCls(link.href, pathname)}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}

            {visibleSections.includes("account") && (
              <>
                <div className="text-sm text-gray-500 px-2 mt-4">
                  إدارة الحساب
                </div>
                {sidebarLinks.account.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={linkCls(link.href, pathname)}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
