"use client";

import { useEffect, useState } from "react";
import { SvgIcon, type SvgIconProps } from "@mui/material";

interface GameIconProps extends SvgIconProps {
    name: string;
}

const pathsCache = new Map<string, string[]>();

export function GameIcon({ name, ...props }: GameIconProps) {
    const [paths, setPaths] = useState<string[] | null>(null);

    useEffect(() => {
        if (pathsCache.has(name)) {
            setPaths(pathsCache.get(name)!);
            return;
        }
        fetch(`/icons/${name}.json`)
            .then((r) => (r.ok ? r.json() : []))
            .then((p: string[]) => {
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
                overflow: "visible",
            }}
        >
            {paths?.map((d, i) => <path key={i} d={d} />)}
        </SvgIcon>
    );
}
