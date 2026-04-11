import { useState, useEffect } from "react";
import { Monitor, Save, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { xiboService } from "@/services/XiboAPI";
import type { Display } from "@/types/display";
import { validateDisplayForm, type ValidationErrors } from "@/utils/validation";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { notifyAndLog } from '@/utils/notifyAndLog';
import type { Json } from "@/types/database";
import { supabase } from "@/lib/supabaseClient";

// Define diagnostics type
interface DisplayDiagnostics {
    status: 'online' | 'offline' | 'maintenance';
    lastSeen: string;
}

const EditDisplay = () => {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore(state => state.addNotification);

    // Add mode detection (create/edit) and deletion logic
    const isEditMode = Boolean(id);

    // Form state
    const initialFormState: Partial<Display> = {
        name: "",
        location: "",
        group_name: "default",
        status: "active",
    };
    const [formData, setFormData] = useState<Partial<Display>>(isEditMode ? initialFormState : initialFormState);
    const [isLoading, setIsLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<ValidationErrors>({});

    // Diagnostics and remote commands state
    const [diagnostics, setDiagnostics] = useState<DisplayDiagnostics | null>(null);
    const [screenshotUrl, setScreenshotUrl] = useState<string>("");
    const [logs, setLogs] = useState<string[]>([]);
    const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
    const [commandLoading, setCommandLoading] = useState<string | null>(null);

    // Replace xiboService with xiboApi for diagnostics and commands
    useEffect(() => {
        const loadDisplay = async () => {
            if (!id) return;
            try {
                const displays = await xiboApi.getDisplays();
                const display = displays.find(d => d.id === id);
                if (!display) {
                    toast({
                        title: "Error",
                        description: "Display not found",
                        variant: "destructive"
                    });
                    navigate("/displays");
                    return;
                }
                setFormData(display as Partial<Display>);
            } catch (error) {
                console.error("Error loading display:", error);
                toast({
                    title: "Error",
                    description: "Failed to load display details",
                    variant: "destructive"
                });
            }
        };
        loadDisplay();
    }, [id, navigate, toast]);

    useEffect(() => {
        const fetchDiagnostics = async () => {
            if (!id) return;
            setDiagnosticsLoading(true);
            try {
                const status = await xiboApi.getDisplayStatus(id);
                setDiagnostics(status);
                const screenshot = await xiboApi.getDisplayScreenshot(id);
                setScreenshotUrl(screenshot);
                const logsData = await xiboApi.getDisplayLogs(id);
                setLogs(logsData);
            } catch (error) {
                toast({
                    title: "Diagnostics Error",
                    description: error instanceof Error ? error.message : 'Failed to fetch diagnostics',
                    variant: "destructive"
                });
            } finally {
                setDiagnosticsLoading(false);
            }
        };
        if (isEditMode) fetchDiagnostics();
    }, [id, isEditMode, toast]);

    const clearError = (field: string) => {
        if (formErrors[field]) {
            setFormErrors({ ...formErrors, [field]: "" });
        }
    };

    // Fix formData state update logic
    const handleSelectChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        clearError(field);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        clearError(name);
    };

    // Remove localStorage user logic
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [userLoading, setUserLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            setUserLoading(true);
            const { data } = await supabase.auth.getUser();
            if (data?.user?.id) {
                setUserId(data.user.id);
            } else {
                setUserId(undefined);
            }
            setUserLoading(false);
        };
        fetchUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData || !id) return;
        if (!userId) {
            toast({
                title: "Authentication Error",
                description: "User not authenticated. Please log in again.",
                variant: "destructive"
            });
            return;
        }
        setIsLoading(true);
        try {
            const { errors, hasErrors } = validateDisplayForm(formData);
            if (hasErrors) {
                setFormErrors(errors);
                toast({
                    title: "Validation Error",
                    description: "Please check all required fields",
                    variant: "destructive"
                });
                return;
            }
            setFormErrors({});
            const updatedDisplay = await xiboService.updateDisplay(id, formData, userId);
            await queryClient.invalidateQueries({ queryKey: ["displays"] });
            toast({
                title: "Success!",
                description: `Display "${formData.name}" has been updated successfully`,
                variant: "default"
            });
            await notifyAndLog({
                title: "Display Updated",
                message: `Display ${formData.name} has been successfully updated.`,
                type: "success",
                link: "/displays",
                action_type: "edit",
                entity: "display",
                entity_id: id,
                user_id: userId,
                meta: formData as unknown as Json
            });
            navigate("/displays");
        } catch (error) {
            console.error("Create display error:", error);
            toast({
                title: "Error Creating Display",
                description: error instanceof Error ? error.message : 'Failed to create display',
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Add delete handler
    const handleDelete = async () => {
        if (!formData || !id) return;
        setIsLoading(true);
        try {
            await xiboService.deleteDisplay(id, userId);
            await queryClient.invalidateQueries({ queryKey: ["displays"] });
            toast({
                title: "Display Deleted",
                description: `Display "${formData.name}" has been deleted successfully`,
                variant: "default"
            });
            await notifyAndLog({
                title: "Display Deleted",
                message: `Display ${formData.name} has been deleted.`,
                type: "success",
                link: "/displays",
                action_type: "delete",
                entity: "display",
                entity_id: id,
                user_id,
                meta: formData as Json
            });
            navigate("/displays");
        } catch (error) {
            console.error('Error deleting display:', error);
            toast({
                title: "Error Deleting Display",
                description: error instanceof Error ? error.message : 'Failed to delete display',
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Add create handler
    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { errors, hasErrors } = validateDisplayForm(formData as Display);
            if (hasErrors) {
                setFormErrors(errors);
                toast({
                    title: "Validation Error",
                    description: "Please check all required fields",
                    variant: "destructive"
                });
                setIsLoading(false);
                return;
            }
            setFormErrors({});
            // Generate new ID (reuse logic from CreateDisplay)
            const { data: maxDisplay, error: fetchError } = await supabase
                .from("displays")
                .select("id")
                .order("id", { ascending: false })
                .limit(1);
            let maxNum = 0;
            if (maxDisplay && maxDisplay.length > 0) {
                const match = typeof maxDisplay[0].id === "string" && maxDisplay[0].id.match(/^DSP(\d+)$/i);
                if (match) {
                    maxNum = parseInt(match[1], 10);
                }
            }
            const newId = `DSP${String(maxNum + 1).padStart(3, "0")}`;
            await supabase.from("displays").insert([
                {
                    id: newId,
                    name: formData.name?.toString() || "",
                    location: formData.location?.toString() || "",
                    group_name: formData.group_name?.toString() || "default",
                    status: formData.status?.toString() || "active",
                }
            ]);
            await queryClient.invalidateQueries({ queryKey: ["displays"] });
            toast({
                title: "Success!",
                description: `Display "${formData.name}" has been created successfully`,
                variant: "default"
            });
            await notifyAndLog({
                title: "New Display Created",
                message: `Display ${formData.name} has been successfully created and added to your network.`,
                type: "success",
                link: "/displays",
                action_type: "create",
                entity: "display",
                entity_id: newId,
                user_id,
                meta: formData as Json
            });
            navigate("/displays");
        } catch (error) {
            console.error("Create display error:", error);
            toast({
                title: "Error Creating Display",
                description: error instanceof Error ? error.message : 'Failed to create display',
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Remote command handlers
    const handleReboot = async () => {
        setCommandLoading("reboot");
        try {
            await xiboApi.rebootDisplay(id!);
            toast({ title: "Reboot Command Sent", description: "Display will reboot shortly.", variant: "default" });
        } catch (error) {
            toast({ title: "Reboot Error", description: error instanceof Error ? error.message : 'Failed to send reboot command', variant: "destructive" });
        } finally {
            setCommandLoading(null);
        }
    };
    const handleUpdate = async () => {
        setCommandLoading("update");
        try {
            await xiboApi.updateDisplay(id!);
            toast({ title: "Update Command Sent", description: "Display will update shortly.", variant: "default" });
        } catch (error) {
            toast({ title: "Update Error", description: error instanceof Error ? error.message : 'Failed to send update command', variant: "destructive" });
        } finally {
            setCommandLoading(null);
        }
    };
    const handleScreenshot = async () => {
        setCommandLoading("screenshot");
        try {
            const url = await xiboApi.takeScreenshot(id!);
            setScreenshotUrl(url);
            toast({ title: "Screenshot Taken", description: "Latest screenshot fetched.", variant: "default" });
        } catch (error) {
            toast({ title: "Screenshot Error", description: error instanceof Error ? error.message : 'Failed to take screenshot', variant: "destructive" });
        } finally {
            setCommandLoading(null);
        }
    };

    if (!formData) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => navigate("/displays")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center">
                        <Monitor className="mr-2 h-8 w-8" />
                        Edit Display
                    </h2>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Display Details</CardTitle>
                    <CardDescription>
                        Update information about this display
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={isEditMode ? handleSubmit : handleCreate} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Enter a name for the display"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    aria-invalid={formErrors.name ? "true" : "false"}
                                />
                                {formErrors.name && (
                                    <p className="text-sm text-destructive">{formErrors.name}</p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    A unique name to identify this display
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
                                <Input
                                    id="location"
                                    name="location"
                                    placeholder="Where is this display located?"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    aria-invalid={formErrors.location ? "true" : "false"}
                                />
                                {formErrors.location && (
                                    <p className="text-sm text-destructive">{formErrors.location}</p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Physical location of the display
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="group_name">Group</Label>
                                <Select
                                    value={formData.group_name}
                                    onValueChange={(value) => handleSelectChange("group_name", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Default Group</SelectItem>
                                        <SelectItem value="reception">Reception Area</SelectItem>
                                        <SelectItem value="meeting">Meeting Rooms</SelectItem>
                                        <SelectItem value="cafeteria">Cafeteria</SelectItem>
                                        <SelectItem value="office">Office Area</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    Group this display belongs to
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resolution">Resolution</Label>
                                <Select
                                    value={formData.resolution}
                                    onValueChange={(value) => handleSelectChange("resolution", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select resolution" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1920x1080">1920x1080 (FHD)</SelectItem>
                                        <SelectItem value="3840x2160">3840x2160 (4K UHD)</SelectItem>
                                        <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                                        <SelectItem value="2560x1440">2560x1440 (QHD)</SelectItem>
                                        <SelectItem value="1366x768">1366x768 (HD)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    Display screen resolution
                                </p>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Additional information about this display"
                                    value={formData.description || ""}
                                    onChange={handleChange}
                                    rows={4}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Optional details about the display's purpose or other notes
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/displays")}
                            >
                                Cancel
                            </Button>
                            {isEditMode && (
                                <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
                                    Delete Display
                                </Button>
                            )}
                            <Button type="submit" disabled={isLoading || userLoading || !userId}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Diagnostics Section */}
            {isEditMode && (
                <Card>
                    <CardHeader>
                        <CardTitle>Remote Diagnostics</CardTitle>
                        <CardDescription>Live status, last seen, screenshot, and logs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {diagnosticsLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : diagnostics ? (
                            <div className="space-y-4">
                                <div className="flex gap-6 items-center">
                                    <div>
                                        <span className={`px-2 py-1 rounded text-white ${diagnostics.status === 'online' ? 'bg-green-600' : diagnostics.status === 'offline' ? 'bg-red-600' : 'bg-yellow-600'}`}>{diagnostics.status}</span>
                                        <div className="text-xs text-muted-foreground">Live Status</div>
                                    </div>
                                    <div>
                                        <span className="font-mono">{diagnostics.lastSeen}</span>
                                        <div className="text-xs text-muted-foreground">Last Seen</div>
                                    </div>
                                    <div>
                                        <Button size="sm" variant="outline" onClick={handleReboot} disabled={commandLoading === 'reboot'}>Reboot</Button>
                                        <Button size="sm" variant="outline" onClick={handleUpdate} disabled={commandLoading === 'update'}>Update</Button>
                                        <Button size="sm" variant="outline" onClick={handleScreenshot} disabled={commandLoading === 'screenshot'}>Screenshot</Button>
                                    </div>
                                </div>
                                {screenshotUrl && (
                                    <div>
                                        <img src={screenshotUrl} alt="Display Screenshot" className="border rounded w-full max-w-md" />
                                        <div className="text-xs text-muted-foreground">Latest Screenshot</div>
                                    </div>
                                )}
                                <div>
                                    <div className="font-semibold mb-1">Logs</div>
                                    <div className="bg-muted p-2 rounded text-xs max-h-40 overflow-auto">
                                        {logs.length > 0 ? logs.map((log, i) => <div key={i}>{log}</div>) : <span>No logs available.</span>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>No diagnostics available.</div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default EditDisplay;
