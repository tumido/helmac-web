"use client";

import { Fab, Zoom, useScrollTrigger } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

export function ScrollToTop() {
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 400,
    });

    const handleClick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <Zoom in={trigger}>
            <Fab
                size="small"
                aria-label="Zpět nahoru"
                onClick={handleClick}
                sx={{
                    position: "fixed",
                    bottom: 80,
                    right: 24,
                    zIndex: 1000,
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": {
                        backgroundColor: "primary.light",
                        boxShadow: (theme) =>
                            `0 0 16px ${theme.palette.primary.light}`,
                    },
                }}
            >
                <KeyboardArrowUpIcon />
            </Fab>
        </Zoom>
    );
}
