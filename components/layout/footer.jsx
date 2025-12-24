"use client";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import Container from "../ui/Container";
import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();

    // Hide footer on admin routes
    if (pathname && pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <footer className="bg-background text-label border-t border-gray-300 mt-10">
            <Container className="px-8 py-10 grid md:grid-cols-3 gap-8 justify-center">
                <div className="flex flex-col gap-4">
                    <span className="text-primary text-3xl font-bold">بارق</span>
                    <p className="text-sm text-label">عن بارق: منصة تعليمية لتقديم الخدمات الأكاديمية والمشاريع للطلاب والخريجين.</p>
                </div>

                <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-lg">روابط سريعة</h3>
                    <Link href="/faq" className="hover:text-primary">الأسئلة الشائعة</Link>
                    <Link href="/terms" className="hover:text-primary">شروط الاستخدام</Link>
                    <Link href="/complaints" className="hover:text-primary">إرسال شكوى</Link>
                </div>

                <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-lg">تابع بارق</h3>
                    <div className="flex gap-4 mt-2">
                        <a href="#" className="hover:text-primary"><Facebook className="w-6 h-6" /></a>
                        <a href="#" className="hover:text-primary"><Twitter className="w-6 h-6" /></a>
                        <a href="#" className="hover:text-primary"><Instagram className="w-6 h-6" /></a>
                        <a href="#" className="hover:text-primary"><Linkedin className="w-6 h-6" /></a>
                    </div>
                </div>
            </Container>
            {/* Footer Bottom */}
            <div className="bg-gray-100 text-gray-500 text-sm text-center py-4 mt-6">
                &copy; {new Date().getFullYear()} بارق جميع الحقوق محفوظة
            </div>
        </footer>
    );
}
