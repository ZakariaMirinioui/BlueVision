import { useState, useEffect } from "react";
import { Monitor, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
import { notifyAndLog } from '@/utils/notifyAndLog';
import { supabase } from "@/lib/supabaseClient";

const CreateDisplay = () => {
  console.log('Rendering CreateDisplay component');
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<Partial<Display>>({
    name: "",
    location: "",
    group_name: "default",
    status: "active",
  });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userLoading, setUserLoading] = useState(true);

  // Always fetch the current Supabase user
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
      // Debug log
      console.log('userId:', data?.user?.id, 'userLoading:', userLoading);
    };
    fetchUser();
  }, []);

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: "" });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      const { errors, hasErrors } = validateDisplayForm(formData as any);
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
      // Fetch the max DSP### id from Supabase and generate the next id
      const { data: maxDisplay, error: fetchError } = await supabase
        .from("displays")
        .select("id")
        .order("id", { ascending: false })
        .limit(1);
      if (fetchError) {
        console.error("Error fetching displays for id generation:", fetchError);
        throw fetchError;
      }
      let maxNum = 0;
      if (maxDisplay && maxDisplay.length > 0) {
        const match = typeof maxDisplay[0].id === "string" && maxDisplay[0].id.match(/^DSP(\d+)$/i);
        if (match) {
          maxNum = parseInt(match[1], 10);
        }
      }
      const newId = `DSP${String(maxNum + 1).padStart(3, "0")}`;
      const { error } = await supabase.from("displays").insert([
        {
          id: newId,
          name: formData.name?.toString() || "",
          location: formData.location?.toString() || "",
          group_name: formData.group_name?.toString() || "default",
          status: formData.status?.toString() || "active",
          user_id: userId // Always set user_id from Supabase
        }
      ]);
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["displays"] });
      toast({
        title: "Success!",
        description: `Display "${formData.name}" has been created successfully`,
        variant: "default"
      });
      await notifyAndLog({
        title: "New Display Created",
        message: `Display "${formData.name}" has been successfully created and added to your network.`,
        type: "success",
        link: "/displays",
        action_type: "create",
        entity: "display",
        entity_id: newId,
        user_id: userId, // Always set user_id from Supabase
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

  return (
    <div className="space-y-6">
      {userLoading && (
        <div className="flex items-center justify-center py-8">
          <span>Loading user authentication...</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/displays")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <Plus className="mr-2 h-8 w-8" />
            <Monitor className="mr-2 h-8 w-8" />
            Create New Display
          </h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Display Details</CardTitle>
          <CardDescription>
            Enter information about the new display
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Display status
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
              <Button
                variant="default"
                type="submit"
                disabled={isLoading || userLoading || !userId}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : null}
                Create Display
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateDisplay;
