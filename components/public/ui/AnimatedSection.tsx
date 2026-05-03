"use client";

import { Box } from "@mui/material";
import { ReactNode, useEffect, useRef, useSyncExternalStore } from "react";

function subscribePrefersReducedMotion(callback: () => void) {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
}

function getPrefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getPrefersReducedMotionServer() {
    return false;
}

function useIntersectionVisible(
    ref: React.RefObject<HTMLDivElement | null>,
    skip: boolean
) {
    const visibleRef = useRef(false);

    useEffect(() => {
        if (skip || visibleRef.current) {
            return;
        }

        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    visibleRef.current = true;
                    observer.disconnect();
                    element.style.opacity = "1";
                    element.style.transform = "translateY(0)";
                }
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -50px 0px",
            }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [ref, skip]);

    return visibleRef;
}

interface AnimatedSectionProps {
    children: ReactNode;
    delay?: number;
    disableAnimation?: boolean;
}

export function AnimatedSection({
    children,
    delay = 0,
    disableAnimation = false,
}: AnimatedSectionProps) {
    const ref = useRef<HTMLDivElement>(null);

    const prefersReducedMotion = useSyncExternalStore(
        subscribePrefersReducedMotion,
        getPrefersReducedMotion,
        getPrefersReducedMotionServer
    );

    const shouldAnimate = !disableAnimation && !prefersReducedMotion;
    useIntersectionVisible(ref, !shouldAnimate);

    return (
        <Box
            ref={ref}
            sx={{
                opacity: shouldAnimate ? 0 : 1,
                transform: shouldAnimate ? "translateY(30px)" : "translateY(0)",
                transition: shouldAnimate
                    ? `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`
                    : "none",
            }}
        >
            {children}
        </Box>
    );
}
