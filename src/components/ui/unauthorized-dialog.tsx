import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ShieldX } from "lucide-react"

interface UnauthorizedDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    message?: string
    action?: string
}

export function UnauthorizedDialog({
    open,
    onOpenChange,
    title = "Access Denied",
    message = "You don't have permission to perform this action.",
    action = "Contact your administrator if you believe this is an error."
}: UnauthorizedDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        <ShieldX className="h-5 w-5 text-destructive" />
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-2">
                        <p>{message}</p>
                        <p className="text-sm text-muted-foreground">{action}</p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => onOpenChange(false)}>
                        OK
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}