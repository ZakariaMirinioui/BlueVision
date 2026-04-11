import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

interface PlayerConfigDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (config: PlayerConfig) => void;
}

interface PlayerConfig {
    cmsAddress: string;
    cmsKey: string;
    localLibrary: string;
}

export function PlayerConfigDialog({ isOpen, onClose, onConnect }: PlayerConfigDialogProps) {
    const { toast } = useToast();
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<'idle' | 'connecting' | 'validating' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [config, setConfig] = useState<PlayerConfig>({
        cmsAddress: 'http://10.147.60.93/xmds.php',
        cmsKey: 'FatPpkRL',
        localLibrary: 'C:\\Users\\DELL\\Documents\\Xibo Library'
    });

    const handleConnect = async () => {
        setIsConnecting(true);
        setCurrentStatus('connecting');
        setStatusMessage('Connecting to display...');

        try {
            await onConnect(config);
            setCurrentStatus('validating');
            setStatusMessage('Configuration sent successfully. Validating...');

            toast({
                title: "Configuring Display",
                description: "Configuration sent successfully. Applying settings...",
            });

            // Keep dialog open for a moment to show the validating state
            setTimeout(() => {
                setCurrentStatus('idle');
                setIsConnecting(false);
                onClose();

                toast({
                    title: "Display Configured",
                    description: "Configuration applied. Display will reboot now.",
                });
            }, 2000);
        } catch (error) {
            setCurrentStatus('error');
            const errorMsg = error instanceof Error ? error.message : "Failed to connect to display";
            setStatusMessage(errorMsg);

            toast({
                title: "Configuration Failed",
                description: errorMsg,
                variant: "destructive",
            });
            setIsConnecting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Player Configuration</DialogTitle>
                    <DialogDescription>
                        Configure the connection settings for the Xibo Player
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {currentStatus === 'error' && statusMessage && (
                        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">{statusMessage}</div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="cmsAddress">CMS Address</Label>
                        <Input
                            id="cmsAddress"
                            placeholder="http://your-cms-address/xmds.php"
                            value={config.cmsAddress}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, cmsAddress: e.target.value })}
                            disabled={isConnecting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cmsKey">CMS Key</Label>
                        <Input
                            id="cmsKey"
                            placeholder="Enter your CMS key"
                            value={config.cmsKey}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, cmsKey: e.target.value })}
                            disabled={isConnecting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="localLibrary">Local Library</Label>
                        <div className="flex gap-2">
                            <Input
                                id="localLibrary"
                                placeholder="Path to local library"
                                value={config.localLibrary}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, localLibrary: e.target.value })}
                                disabled={isConnecting}
                            />
                            <Button variant="outline" size="sm" disabled={isConnecting}>
                                Browse
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row justify-between gap-4">
                    {currentStatus !== 'idle' && (
                        <div className={`text-sm flex items-center gap-2 ${currentStatus === 'error' ? 'text-destructive' : 'text-primary'
                            }`}>
                            {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {statusMessage}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isConnecting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConnect}
                            disabled={isConnecting || !config.cmsAddress || !config.cmsKey}
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                "Connect"
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
