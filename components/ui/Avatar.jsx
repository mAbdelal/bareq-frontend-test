"use client";

import { useState } from "react";
import Image from "next/image";

export default function Avatar({ url, fallbackLetter, alt = "Avatar", size = 96, className = "" }) {
    const [error, setError] = useState(!url); 

    return (
        <div
            className={`relative rounded-full overflow-hidden flex items-center justify-center ring-4 ring-white shadow-md bg-gray-200 text-label font-bold ${className}`}
            style={{ width: size, height: size, fontSize: size / 2.5 }}
        >
            {!error ? (
                <Image
                    src={url}
                    alt={alt}
                    fill
                    className="object-cover rounded-full"
                    onError={() => setError(true)}
                />
            ) : (
                    <span className="text-2xl text-gray-600">{fallbackLetter}</span>
            )}
        </div>
    );
}
