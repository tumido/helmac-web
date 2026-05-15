"use client";

import { useEffect, useSyncExternalStore } from "react";
import { SvgIcon, type SvgIconProps } from "@mui/material";

interface GameIconProps extends SvgIconProps {
    name: string;
}

const pathsCache = new Map<string, string[]>();
const listeners = new Set<() => void>();

function notifyListeners() {
    for (const fn of listeners) fn();
}

function subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function GameIcon({ name, ...props }: GameIconProps) {
    const paths = useSyncExternalStore(
        subscribe,
        () => pathsCache.get(name) ?? null,
        () => null
    );

    useEffect(() => {
        if (pathsCache.has(name)) return;
        fetch(`/icons/${name}.json`)
            .then((r) => (r.ok ? r.json() : []))
            .then((p: string[]) => {
                pathsCache.set(name, p);
                notifyListeners();
            })
            .catch(() => {
                pathsCache.set(name, []);
                notifyListeners();
            });
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
