"use client";

import { SvgIcon, type SvgIconProps } from "@mui/material";
import { getIconByName } from "./registry";

interface GameIconProps extends SvgIconProps {
    name: string;
}

export function GameIcon({ name, ...props }: GameIconProps) {
    const icon = getIconByName(name);
    if (!icon) return null;

    return (
        <SvgIcon viewBox="0 0 512 512" {...props}>
            {icon.paths.map((d, i) => (
                <path key={i} d={d} />
            ))}
        </SvgIcon>
    );
}
