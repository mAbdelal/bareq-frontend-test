
"use client";

import React from "react";

export default function StarRating({ value = 0, max = 5, size = 24 }) {
    const stars = [];

    for (let i = 1; i <= max; i++) {
        let fill = 0;

        if (value >= i) fill = 1; // full star
        else if (value + 0.5 >= i) fill = 0.5; // half star
        else fill = 0; // empty star

        stars.push(
            <svg
                key={i}
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill={fill === 1 ? "#FBBF24" : fill === 0.5 ? "url(#half-gradient)" : "#D1D5DB"}
                xmlns="http://www.w3.org/2000/svg"
                className="inline-block"
            >
                {fill === 0.5 && (
                    <defs>
                        <linearGradient id="half-gradient">
                            <stop offset="50%" stopColor="#FBBF24" />
                            <stop offset="50%" stopColor="#D1D5DB" />
                        </linearGradient>
                    </defs>
                )}
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88-5-4.87 6.91-1.01L12 2z" />
            </svg>
        );
    }

    return (
        <div className="flex items-center gap-1" dir="rtl">
            {stars}
        </div>
    );
}
