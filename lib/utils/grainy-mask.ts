const grainSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
<defs>
<filter id='g'>
<feTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='4' seed='2' result='n'/>
<feColorMatrix in='n' type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.3 0 0 0 -0.1'/>
</filter>
</defs>
<rect width='200' height='200' filter='url(#g)'/>
</svg>`;

function encode(svg: string) {
    return `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\n/g, ""))}")`;
}

const FADE_H =
    "linear-gradient(to right, transparent, black 2%, black 98%, transparent)";
const FADE_V =
    "linear-gradient(to bottom, transparent, black 2%, black 98%, transparent)";

export const grainyMaskHorizontal = {
    maskImage: `${encode(grainSvg)}, ${FADE_H}`,
    maskComposite: "add",
    maskSize: "200px 200px, 100% 100%",
    maskRepeat: "repeat, no-repeat",
} as const;

export const grainyMaskBoth = {
    maskImage: `${encode(grainSvg)}, ${FADE_H}, ${FADE_V}`,
    maskComposite: "add, intersect",
    maskSize: "200px 200px, 100% 100%, 100% 100%",
    maskRepeat: "repeat, no-repeat, no-repeat",
} as const;
