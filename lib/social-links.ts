import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import type { SvgIconComponent } from "@mui/icons-material";

export interface SocialLink {
    label: string;
    href: string;
    Icon: SvgIconComponent;
}

export const SOCIAL_LINKS: SocialLink[] = [
    {
        label: "Facebook",
        href: "https://www.facebook.com/helmac.cz/",
        Icon: FacebookRoundedIcon,
    },
    {
        label: "Instagram",
        href: "https://www.instagram.com/helmac.cz/",
        Icon: InstagramIcon,
    },
];
