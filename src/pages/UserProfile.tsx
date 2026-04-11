import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Shield, Key, LogOut, Edit, Save, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/integrations/supabase/client';

const UserProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile, user, signOut, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    email: user?.email || '',
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (profile && user) {
      setFormData({
        username: profile.username,
        email: user.email || '',
      });
    }
  }, [profile, user]);

  const handleEditToggle = async () => {
    if (isEditing) {
      try {
        // Update profile using the auth store method
        const result = await updateProfile({ username: formData.username });

        if (result.error) {
          toast({
            title: "Update Failed",
            description: result.error,
            variant: "destructive"
          });
          return;
        }

        // Update email in Supabase Auth if it changed
        if (formData.email !== user?.email) {
          const { error: authError } = await supabase.auth.updateUser({ email: formData.email });
          if (authError) {
            toast({
              title: "Email Update Failed",
              description: authError.message,
              variant: "destructive"
            });
            return;
          }
        }

        toast({
          title: "Profile Updated",
          description: "Your profile information has been updated successfully."
        });
      } catch (error) {
        toast({
          title: "Update Failed",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Password Update Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        title: "Password Update Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account",
    });
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-8 md:px-8 lg:px-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                User Profile
              </h2>
              <p className="text-muted-foreground max-w-[600px] leading-relaxed">
                View and manage your personal information and security settings
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="bg-destructive/90 hover:bg-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
              <div className="p-3 rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Username</p>
                <h3 className="text-xl font-bold">{profile?.username || 'User'}</h3>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                <h3 className="text-xl font-bold">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Today'}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <h3 className="text-xl font-bold">
                  <Badge
                    variant={
                      profile?.role === 'admin' ? 'destructive' :
                        profile?.role === 'manager' ? 'default' :
                          'secondary'
                    }
                    className="font-medium text-sm"
                  >
                    {profile?.role?.toUpperCase() || 'USER'}
                  </Badge>
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 md:px-8 lg:px-12 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-lg shadow-secondary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your account details and preferences</CardDescription>
                </div>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={handleEditToggle}
                  className={isEditing ? "bg-primary shadow-lg shadow-primary/25 hover:shadow-primary/40" : ""}
                >
                  {isEditing ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleFormChange}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted/50" : "border-input/50 focus:border-primary"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted/50" : "border-input/50 focus:border-primary"}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg shadow-secondary/5">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="border-input/50 focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-input/50 focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-input/50 focus:border-primary"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-4 bg-primary shadow-lg shadow-primary/25 hover:shadow-primary/40"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
