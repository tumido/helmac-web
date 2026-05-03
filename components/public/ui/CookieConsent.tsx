"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

function hasCookieConsent(): boolean {
    return document.cookie.split(";").some((c) => c.trim().startsWith("cookie_consent="));
}

export function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!hasCookieConsent()) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reading document.cookie (external store) on mount
            setVisible(true);
        }
    }, []);

    if (!visible) return null;

    const handleAccept = () => {
        document.cookie = "cookie_consent=1; path=/; max-age=31536000; SameSite=Lax";
        setVisible(false);
    };

    return (
        <Paper
            elevation={4}
            sx={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        py: 2,
                        flexWrap: { xs: "wrap", sm: "nowrap" },
                    }}
                >
                    <Typography variant="body2">
                        Využíváme soubory cookies nezbytné pro správné fungování stránek. Žádné analytické ani
                        marketingové cookies nepoužíváme.
                        Pokračováním v prohlížení souhlasíte s jejich použitím.
                    </Typography>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleAccept}
                        sx={{ flexShrink: 0 }}
                    >
                        OK
                    </Button>
                </Box>
            </Container>
        </Paper>
    );
}
