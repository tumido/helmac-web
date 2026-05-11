"use client";

import { useCallback, useRef } from "react";
import {
    TabScrollButton as MuiTabScrollButton,
    TabScrollButtonProps,
    Box,
} from "@mui/material";

const TAB_SCROLL_COUNT = 2.5;

export function TabScrollButton(props: TabScrollButtonProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            const scroller = wrapperRef.current?.closest(
                ".MuiTabs-root"
            )?.querySelector<HTMLElement>(".MuiTabs-scroller");
            if (!scroller) return;

            const tabs = scroller.querySelectorAll<HTMLElement>(
                ".MuiTab-root"
            );
            if (tabs.length === 0) return;

            const fullTabs = Math.min(
                Math.floor(TAB_SCROLL_COUNT),
                tabs.length
            );
            const fraction = TAB_SCROLL_COUNT - fullTabs;
            let scrollAmount = 0;
            for (let i = 0; i < fullTabs; i++) {
                scrollAmount += tabs[i].offsetWidth;
            }
            if (fraction > 0 && fullTabs < tabs.length) {
                scrollAmount +=
                    tabs[fullTabs].offsetWidth * fraction;
            }

            const direction = props.direction === "left" ? -1 : 1;
            scroller.scrollBy({
                left: direction * scrollAmount,
                behavior: "smooth",
            });
        },
        [props.direction]
    );

    return (
        <Box ref={wrapperRef} sx={{ display: "inline-flex" }}>
            <MuiTabScrollButton
                {...props}
                onClick={handleClick}
            />
        </Box>
    );
}
