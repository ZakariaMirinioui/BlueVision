import type { MediaItem } from "@/types/media";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { notifyAndLog } from '@/utils/notifyAndLog';
import { useToast } from "@/hooks/use-toast";

interface EditMediaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    media: MediaItem | null;
    onMediaUpdated: () => Promise<void> | void;
}

export default function EditMediaDialog({ open, onOpenChange, media, onMediaUpdated }: EditMediaDialogProps) {
    const [name, setName] = useState(media?.name || "");
    const [type, setType] = useState(media?.type || "");
    const [customType, setCustomType] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setName(media?.name || "");
        setType(media?.type || "");
        setCustomType("");
    }, [media]);

    const handleSave = async () => {
        if (!media) return;
        if (!name.trim()) {
            toast({ variant: "destructive", title: "Name required", description: "Media name cannot be empty." });
            return;
        }
        const finalType = type === "other" ? customType.trim() : type.trim();
        if (!finalType) {
            toast({ variant: "destructive", title: "Type required", description: "Media type cannot be empty." });
            return;
        }
        setLoading(true);
        let closed = false;
        const closeDialog = () => {
            if (!closed) {
                setLoading(false);
                onOpenChange(false);
                closed = true;
            }
        };
        // Fallback: always close after 3 seconds
        const timeout = setTimeout(closeDialog, 3000);
        try {
            const { error } = await supabase.from("media").update({
                name: name.trim(),
                type: finalType,
                updated_at: new Date().toISOString(),
            }).eq("id", Number(media.id));
            if (error) {
                toast({ variant: "destructive", title: "Update failed", description: error.message });
                closeDialog();
                clearTimeout(timeout);
                return;
            }
            toast({ title: "Media updated" });
            // Log activity for media edit
            let userId = null;
            try {
                const stored = localStorage.getItem('user') || localStorage.getItem('xibo_user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    userId = parsed.id || parsed.auth_uid || null;
                }
            } catch { }
            // Compute changed fields for detailed logging
            const changedFields: Record<string, { previous: string, current: string }> = {};
            if (media.name !== name.trim()) {
                changedFields["name"] = { previous: media.name, current: name.trim() };
            }
            if (media.type !== finalType) {
                changedFields["type"] = { previous: media.type, current: finalType };
            }
            await notifyAndLog({
                title: 'Media Modified',
                message: `Media "${name.trim()}" was modified by the user`,
                type: 'info',
                action_type: 'edit',
                entity: 'media',
                entity_id: media.id,
                user_id: userId,
                meta: { mediaId: media.id, name: name.trim(), changedFields }
            });
            await Promise.resolve(onMediaUpdated());
            closeDialog();
        } catch (e) {
            toast({ variant: "destructive", title: "Unexpected error", description: e instanceof Error ? e.message : String(e) });
            closeDialog();
        } finally {
            clearTimeout(timeout);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Media Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="media-name">Name</Label>
                    <Input id="media-name" value={name} onChange={e => setName(e.target.value)} placeholder="Media name" />
                    <Label htmlFor="media-type">Type</Label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger id="media-type">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {type === "other" && (
                        <Input className="mt-2" value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Enter custom type" />
                    )}
                </div>
                <Button onClick={handleSave} disabled={loading || !name.trim() || !(type !== "other" ? type.trim() : customType.trim())} className="w-full mt-2">{loading ? "Saving..." : "Save"}</Button>
            </DialogContent>
        </Dialog>
    );
}
