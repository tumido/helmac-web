import {
    Card,
    Box,
    Typography,
    Divider,
    Tooltip,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { AlbumActions } from "@/components/admin/album-actions";

interface Album {
    id: string;
    slug: string;
    title: string;
    year: {
        year: number;
        title: string;
    };
}

interface AlbumListProps {
    albums: Album[];
    editBasePath?: string;
    showYear?: boolean;
}

export function AlbumList({
    albums,
    editBasePath = "/admin/galerie",
    showYear = true,
}: AlbumListProps) {
    return (
        <Card>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 1.5,
                    backgroundColor: "grey.50",
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Celkem {albums.length} alb
                </Typography>
            </Box>

            {albums.map((album, index) => (
                <Box key={album.id}>
                    {index > 0 && <Divider />}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 2,
                        }}
                    >
                        <Box sx={{ flex: 1 }}>
                            <Typography fontWeight="medium">
                                {album.title}
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mt: 0.5,
                                }}
                            >
                                {showYear && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {album.year.year} - {album.year.title}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                            }}
                        >
                            <Tooltip title="Upravit album">
                                <IconLinkButton
                                    href={`${editBasePath}/${album.id}`}
                                    size="small"
                                >
                                    <Edit />
                                </IconLinkButton>
                            </Tooltip>
                            <AlbumActions albumId={album.id} />
                        </Box>
                    </Box>
                </Box>
            ))}
        </Card>
    );
}
