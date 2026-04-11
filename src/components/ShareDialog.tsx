import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
}

export default function ShareDialog({ open, onOpenChange, url }: ShareDialogProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share Media</DialogTitle>
                </DialogHeader>
                <div className="flex gap-2 items-center">
                    <Input value={url} readOnly className="flex-1" />
                    <Button onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
