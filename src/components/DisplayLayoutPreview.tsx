import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Layout } from '@/types/layout-media';
import { MediaItem } from '@/types/media';
import { AspectRatio } from './ui/aspect-ratio';

interface DisplayLayoutPreviewProps {
    layout: Layout & { media: (MediaItem & { position?: number })[] };
    aspectRatio?: number;
}

export function DisplayLayoutPreview({
    layout,
    aspectRatio = 16 / 9
}: DisplayLayoutPreviewProps) {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    useEffect(() => {
        if (!layout.media?.length) return;

        const interval = setInterval(() => {
            setCurrentMediaIndex((prev) =>
                prev + 1 >= layout.media.length ? 0 : prev + 1
            );
        }, 5000); // Rotate every 5 seconds

        return () => clearInterval(interval);
    }, [layout.media]);

    if (!layout.media?.length) {
        return (
            <AspectRatio ratio={aspectRatio}>
                <div className="flex items-center justify-center h-full bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">No media added</p>
                </div>
            </AspectRatio>
        );
    }

    const currentMedia = layout.media[currentMediaIndex];

    return (
        <AspectRatio ratio={aspectRatio}>
            <div className="w-full h-full overflow-hidden rounded-md">
                {currentMedia.media_type === 'image' || currentMedia.file_type?.startsWith('image/') ? (
                    <img
                        src={currentMedia.file_url || '/placeholder.svg'}
                        alt={currentMedia.name}
                        className="w-full h-full object-cover"
                    />
                ) : currentMedia.media_type === 'video' || currentMedia.file_type?.startsWith('video/') ? (
                    <video
                        src={currentMedia.file_url}
                        autoPlay
                        muted
                        loop
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-muted">
                        <p className="text-sm text-muted-foreground">{currentMedia.name}</p>
                    </div>
                )}
            </div>
        </AspectRatio>
    );
}