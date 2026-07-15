"use client";

import { useEffect, useState } from "react";
import { getPrefersReducedMotion } from "@/lib/motion";

export function BrandMark({ className = "" }: { className?: string }) {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (getPrefersReducedMotion()) {
      setDrawn(true);
      return;
    }
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const strokeClass = `ff-brand-stroke ${drawn ? "is-drawn" : ""}`;
  const dotClass = `ff-brand-dot ${drawn ? "is-drawn" : ""}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
    >
      <path
        className={strokeClass}
        d="M22 48 C22 54 28 58 32 58 C36 58 42 54 42 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        className={strokeClass}
        d="M32 52 C31.2 42 31.6 32 32.4 22 C32.9 15 34.2 10 38 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        className={strokeClass}
        d="M32.2 48 C31.6 40 31.8 30 32.5 21 C33 14.5 34.5 9.5 37.6 6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle className={dotClass} cx="29.5" cy="18" r="1.35" fill="#82c4d1" />
      <circle className={dotClass} cx="35.2" cy="15.2" r="1.2" fill="#82c4d1" />
      <circle className={dotClass} cx="30.2" cy="12.5" r="1.15" fill="#a5e1ed" />
      <circle className={dotClass} cx="36.5" cy="10.8" r="1.05" fill="#82c4d1" />
      <circle className={dotClass} cx="32.8" cy="8.2" r="0.95" fill="#a5e1ed" />
      <circle className={dotClass} cx="37.8" cy="7.2" r="0.85" fill="#82c4d1" />
    </svg>
  );
}
