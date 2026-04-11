import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  AlertCircle,
  Image as ImageIcon,
  FileVideo,
  File,
  X,
  Upload,
  Loader2,
  ChevronRight,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/StatusBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Display } from "@/types/display";

// Type pour la fonction d'envoi de message
type SendMessageFunction = (
  displayIds: number[],
  subject: string,
  body: string,
  isInterrupt?: boolean
) => Promise<any>;

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  displayIds: number[];
  sendMessageFunction: SendMessageFunction;
}

const MessageDialog = ({
  isOpen,
  onClose,
  displayIds,
  sendMessageFunction
}: MessageDialogProps) => {
  const { toast } = useToast();
  const [messageType, setMessageType] = useState("normal");
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState("15");
  const [headline, setHeadline] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Message requis",
        description: "Veuillez saisir un message à envoyer.",
        variant: "destructive",
      });
      return;
    }

    if (displayIds.length === 0) {
      toast({
        title: "Aucun écran sélectionné",
        description: "Veuillez sélectionner au moins un écran pour envoyer le message.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      // Envoyer le message via la fonction fournie
      await sendMessageFunction(
        displayIds,
        headline || "Message",
        message,
        messageType === "emergency" // isInterrupt pour les messages d'urgence
      );

      toast({
        title: messageType === "emergency" ? "Message d'urgence envoyé !" : "Message programmé",
        description: `Votre message ${messageType} a été envoyé à ${displayIds.length} écran(s).`,
        variant: messageType === "emergency" ? "destructive" : "default",
      });

      // Réinitialiser le formulaire
      setMessage("");
      setHeadline("");
      setMessageType("normal");
      onClose();

    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast({
        title: "Erreur d'envoi",
        description: `Problème lors de l'envoi du message: ${error.message || "Erreur inconnue"}`,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Send Message to Displays</DialogTitle>
          <DialogDescription>
            Create a message to send to one or more displays.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message Type</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Standard Message</SelectItem>
                  <SelectItem value="alert">Alert Message</SelectItem>
                  <SelectItem value="emergency">Emergency Broadcast</SelectItem>
                </SelectContent>
              </Select>
              {messageType === "emergency" && (
                <div className="flex items-start gap-2 p-2 mt-2 rounded-md bg-red-50 border border-red-200 text-red-800">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong>Emergency messages will interrupt any currently scheduled content</strong> and
                    will be displayed immediately on all selected screens.
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Message Title</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Enter a title for your message"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message content here"
                rows={5}
              />
            </div>

            <div className="space-y-2 pt-4">
              <Label>Display Duration</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-20"
                  min="1"
                  max="60"
                />
                <span>minutes</span>
                {messageType === "emergency" && (
                  <Badge className="ml-auto bg-destructive">Maximum Priority</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Displays</Label>
              <div className="p-3 border rounded-md bg-muted/30">
                {displayIds.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{displayIds.length} display(s) selected</span>
                      <p className="text-sm text-muted-foreground">
                        IDs: {displayIds.join(', ')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-muted-foreground">
                    No displays selected
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSendMessage} disabled={sending || !message.trim()}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;
