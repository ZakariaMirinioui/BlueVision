
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { MediaItem } from "@/types/media";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface MediaPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    media: MediaItem | null;
}

export default function MediaPreviewDialog({ open, onOpenChange, media }: MediaPreviewDialogProps) {
    const [uploader, setUploader] = useState<{ username?: string } | null>(null);

    useEffect(() => {
        const fetchUploader = async () => {
            if (media?.user_id) {
                const { data, error } = await supabase
                    .from('users')
                    .select('username, auth_uid')
                    .eq('auth_uid', media.user_id)
                    .single();
                if (!error && data) {
                    setUploader({ username: data.username });
                } else {
                    // Debug: log error and data
                    console.error('Failed to fetch uploader:', error, data, media.user_id);
                    setUploader(null);
                }
            } else {
                setUploader(null);
            }
        };
        fetchUploader();
    }, [media]);

    if (!media) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Media Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {media.file_type?.startsWith("image/") ? (
                        <img src={media.file_url} alt={media.name} className="w-full max-h-64 object-contain rounded" />
                    ) : media.file_type?.startsWith("video/") ? (
                        <video src={media.file_url} controls className="w-full max-h-64 rounded" />
                    ) : (
                        <a href={media.file_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Open File</a>
                    )}
                    <div>
                        <div className="font-semibold">{media.name}</div>
                        <div className="text-xs text-muted-foreground">Type: {media.file_type}</div>
                        <div className="text-xs text-muted-foreground">Size: {media.file_size ? (media.file_size / 1024).toFixed(0) + ' KB' : ''}</div>
                        <div className="text-xs text-muted-foreground">Uploaded: {media.created_at ? new Date(media.created_at).toLocaleString() : ''}</div>
                        {uploader ? (
                            <div className="text-xs text-muted-foreground">
                                <div><span className="font-semibold">Owner username : </span>{uploader.username || 'Unknown User'}</div>
                            </div>
                        ) : (
                            <div className="text-xs text-muted-foreground">Owner: N/A</div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                            {(media.tags || []).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
