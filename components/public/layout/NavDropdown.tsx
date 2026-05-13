import { Box, Button, Fade } from "@mui/material";
import { GameIcon } from "@/lib/icons";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
import { LinkButton } from "@/components/ui/link-button";

export interface NavDropdownItem {
    label: string;
    icon?: string | null;
    href?: string;
    action?: () => void;
}

interface NavDropdownProps {
    open: boolean;
    items: NavDropdownItem[];
    onClose: () => void;
}

const menuItemSx = {
    display: "flex",
    width: "100%",
    textAlign: "left",
    px: 1.5,
    py: 0.75,
    gap: 1,
    color: "text.primary",
    fontWeight: 400,
    fontSize: "0.875rem",
    borderRadius: 0,
    justifyContent: "flex-start",
    textTransform: "none",
    whiteSpace: "nowrap",
    borderBottom: "1.5px solid transparent",
    "&:hover": {
        backgroundColor: "transparent",
        color: "primary.main",
        borderColor: "primary.main",
    },
} as const;

const iconBoxSx = {
    width: "1.5em",
    flexShrink: 0,
    mr: 1,
    display: "inline-flex",
    justifyContent: "center",
} as const;

export function NavDropdown({ open, items, onClose }: NavDropdownProps) {
    return (
        <Fade in={open} timeout={150}>
            <Box
                sx={{
                    position: "absolute",
                    top: "calc(100% - 4px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    minWidth: 180,
                    zIndex: 1200,
                    display: open ? "block" : "none",
                }}
            >
                <Box
                    sx={{
                        position: "relative",
                        backgroundColor: "background.paper",
                        pt: 1.5,
                        pb: 1.5,
                    }}
                >
                    <OrnamentalUnderline
                        sx={{
                            position: "absolute",
                            top: 1,
                            left: -1,
                            right: -1,
                            mt: 0,
                            mx: 0,
                        }}
                    />
                    {items.map((item) => {
                        const icon = (
                            <Box component="span" sx={iconBoxSx}>
                                <GameIcon
                                    name={item.icon || "polar-star"}
                                    sx={{
                                        fontSize: "1.5em",
                                        color: "primary.main",
                                    }}
                                />
                            </Box>
                        );

                        if (item.action) {
                            return (
                                <Box
                                    key={item.label}
                                    component="form"
                                    action={item.action}
                                >
                                    <Button
                                        type="submit"
                                        onClick={onClose}
                                        sx={menuItemSx}
                                    >
                                        {icon}
                                        {item.label}
                                    </Button>
                                </Box>
                            );
                        }

                        return (
                            <LinkButton
                                key={item.label}
                                href={item.href!}
                                onClick={onClose}
                                sx={menuItemSx}
                            >
                                {icon}
                                {item.label}
                            </LinkButton>
                        );
                    })}
                    <OrnamentalUnderline
                        sx={{
                            position: "absolute",
                            bottom: 0,
                            left: -1,
                            right: -1,
                            mt: 0,
                            mx: 0,
                            transform: "scaleY(-1)",
                        }}
                    />
                </Box>
            </Box>
        </Fade>
    );
}
