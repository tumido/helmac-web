"use client";

import { useEffect, useState } from "react";
import { SvgIcon, type SvgIconProps } from "@mui/material";

interface GameIconProps extends SvgIconProps {
    name: string;
}

const pathsCache = new Map<string, string[]>();

export function GameIcon({ name, ...props }: GameIconProps) {
    const cached = pathsCache.get(name) ?? null;
    const [fetchedPaths, setFetchedPaths] = useState<{
        name: string;
        paths: string[];
    } | null>(null);
    const paths = cached ?? (fetchedPaths?.name === name ? fetchedPaths.paths : null);

    useEffect(() => {
        if (pathsCache.has(name)) return;
        fetch(`/icons/${name}.json`)
            .then((r) => (r.ok ? r.json() : []))
            .then((p: string[]) => {
                pathsCache.set(name, p);
                setFetchedPaths({ name, paths: p });
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
                overflow: "visible",
            }}
        >
            {paths?.map((d, i) => <path key={i} d={d} />)}
        </SvgIcon>
    );
}
