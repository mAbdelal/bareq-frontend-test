import "./globals.css";
import Container from "@/components/ui/Container";
import { Cairo } from 'next/font/google';
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { UserProvider } from "@/context/UserContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/sonner"

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-cairo',
});

export const metadata = {
  title: "بارق | المنصة الغزية للخدمات الأكاديمية",
  description: "بارق هي منصة خدمات أكاديمية تربط بين الطلاب والمستقلين الأكاديميين لتلبية احتياجاتهم التعليمية بأعلى جودة وأفضل الأسعار.",
};








export default function RootLayout({ children }) {
  return (
    <html lang="ar" className={cairo.className} dir="rtl">
      <body>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <UserProvider>
          <LayoutWrapper>
            <Container className="pt-[50px]">
              <main>{children}</main>
              <Toaster richColors position="top-center" />
            </Container>
          </LayoutWrapper>
        </UserProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
