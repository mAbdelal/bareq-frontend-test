"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function BackLink({ href = "/", children }) {
    return (
        <div>
            <Link
                href={href}
                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
                <ArrowRight className="w-4 h-4" />
                {children}
            </Link>
        </div>
    );
}
