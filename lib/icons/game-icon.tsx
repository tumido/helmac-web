"use client";

import { useEffect, useState } from "react";
import { SvgIcon, type SvgIconProps } from "@mui/material";

interface GameIconProps extends SvgIconProps {
    name: string;
}

const pathsCache = new Map<string, string[]>();

export function GameIcon({ name, ...props }: GameIconProps) {
    const [paths, setPaths] = useState<string[] | null>(
        pathsCache.get(name) ?? null
    );

    useEffect(() => {
        if (pathsCache.has(name)) return;
        import(`./paths/${name}`)
            .then((mod) => {
                const p = mod.default as string[];
                pathsCache.set(name, p);
                setPaths(p);
            })
            .catch(() => pathsCache.set(name, []));
    }, [name]);

    return (
        <SvgIcon
            viewBox="0 0 512 512"
            {...props}
            sx={{
                ...((typeof props.sx === "object" ? props.sx : {}) as object),
                visibility: paths?.length ? "visible" : "hidden",
            }}
        >
            {paths?.map((d, i) => <path key={i} d={d} />)}
        </SvgIcon>
    );
}
