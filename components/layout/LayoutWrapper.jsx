"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./footer";
import { useUser } from "@/context/UserContext";

export default function LayoutWrapper({ children }) {
    const pathname = usePathname();
    const { state } = useUser();
    const [isUserLoaded, setIsUserLoaded] = useState(false);

    useEffect(() => {
        // Wait for user context to load (state.user is no longer undefined)
        if (state.user !== undefined) {
            setIsUserLoaded(true);
        }
    }, [state.user]);

    const noLayoutPages = ["/login", "/register/academic"];
    const hideLayout = noLayoutPages.includes(pathname);

    // Hide navbar and footer for admin users (users with role)
    // Only check role after user context is loaded
    const isAdminUser = isUserLoaded && state.user && state.user.role;

    return (
        <>
            {!hideLayout && !isAdminUser && <Navbar />}
            {children}
            {!hideLayout && !isAdminUser && <Footer />}
        </>
    );
}
