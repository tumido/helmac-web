"use client";

import { Button } from "@mui/material";
import { Logout } from "@mui/icons-material";
import { publicLogout } from "@/lib/actions/public/auth";

export function LogoutButton() {
    return (
        <form action={publicLogout}>
            <Button
                type="submit"
                variant="outlined"
                color="error"
                startIcon={<Logout />}
            >
                Odhlásit se
            </Button>
        </form>
    );
}
