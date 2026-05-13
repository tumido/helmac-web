const grainSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
<filter id='n'>
<feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/>
</filter>
<rect width='100%' height='100%' filter='url(#n)' opacity='0.08'/>
</svg>`;

function encodeSvg(svg: string) {
    return `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\n/g, ""))}")`;
}

export const paperGrainSx = {
    "&::after": {
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: encodeSvg(grainSvg),
        backgroundRepeat: "repeat",
        opacity: 0.4,
        pointerEvents: "none",
        zIndex: 0,
    },
} as const;

export const vignetteSx = (
    color: string = "rgba(0,0,0,0.4)",
) => ({
    "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at center, transparent 40%, ${color} 100%)`,
        pointerEvents: "none",
        zIndex: 0,
    },
});

export const goldShimmerSx = {
    background:
        "linear-gradient(105deg, rgba(201,162,39,0.03) 0%, rgba(201,162,39,0.06) 50%, rgba(201,162,39,0.03) 100%)",
} as const;
