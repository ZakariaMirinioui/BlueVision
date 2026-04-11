import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Settings as SettingsIcon, Lock, Users, Database, Palette, Globe, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { xiboService } from "@/services/XiboAPI";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const SettingsPage = () => {
  const { theme: currentTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);

  // Initialize states with current theme settings
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem("primaryColor") || "#3b82f6");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("fontSize") || "medium");

  // General Settings
  const [companyName, setCompanyName] = useState(() => localStorage.getItem("companyName") || "");
  const [timezone, setTimezone] = useState(() => localStorage.getItem("timezone") || "UTC");
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem("dateFormat") || "MM/DD/YYYY");
  const [enableNotifications, setEnableNotifications] = useState(() => {
    const stored = localStorage.getItem("enableNotifications");
    return stored ? stored === "true" : true;
  });

  // Security Settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorAuth, setTwoFactorAuth] = useState(() => {
    const stored = localStorage.getItem("twoFactorAuth");
    return stored ? stored === "true" : false;
  });

  // User Management
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [users, setUsers] = useState([
    { id: 1, email: "admin@example.com", role: "admin", status: "active" },
    { id: 2, email: "manager@example.com", role: "manager", status: "active" },
    { id: 3, email: "user@example.com", role: "user", status: "inactive" }
  ]);

  // Storage Settings
  const [storageLimit, setStorageLimit] = useState(() => {
    const stored = localStorage.getItem("storageLimit");
    return stored ? parseInt(stored) : 1000;
  });
  const [autoCleanup, setAutoCleanup] = useState(() => {
    const stored = localStorage.getItem("autoCleanup");
    return stored ? stored === "true" : true;
  });
  const [cleanupDays, setCleanupDays] = useState(() => {
    const stored = localStorage.getItem("cleanupDays");
    return stored ? parseInt(stored) : 30;
  });

  // API Settings
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("apiUrl") || "http://10.147.60.91:8080/api");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("apiKey") || "XDz5Pfhx");
  const [apiClientId, setApiClientId] = useState(() => localStorage.getItem("apiClientId") || "");
  const [apiClientSecret, setApiClientSecret] = useState(() => localStorage.getItem("apiClientSecret") || "");

  // Appearance Settings
  const [themeMode, setThemeMode] = useState(() => currentTheme || "system");
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const stored = localStorage.getItem("animationsEnabled");
    return stored ? stored === "true" : true;
  });
  const [highContrastMode, setHighContrastMode] = useState(() => {
    const stored = localStorage.getItem("highContrastMode");
    return stored ? stored === "true" : false;
  });

  const handleSaveGeneralSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage for persistence
      localStorage.setItem('companyName', companyName);
      localStorage.setItem('timezone', timezone);
      localStorage.setItem('dateFormat', dateFormat);
      localStorage.setItem('enableNotifications', enableNotifications.toString());

      // Apply settings to the website
      document.dispatchEvent(new CustomEvent('settingsChanged', {
        detail: {
          companyName,
          timezone,
          dateFormat,
          enableNotifications
        }
      }));

      toast({
        title: "Settings saved",
        description: "General settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation do not match",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Save 2FA setting to localStorage
      localStorage.setItem('twoFactorAuth', twoFactorAuth.toString());

      // Handle password change if provided
      if (currentPassword && newPassword) {
        // In a real app, this would call an API to change the password
        // For now, we'll just simulate success

        // Clear password fields after success
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        toast({
          title: "Password updated",
          description: "Your password has been changed successfully",
        });
      } else {
        toast({
          title: "Security settings saved",
          description: "Security settings have been updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update security settings',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Add user to the list (in a real app, this would call an API)
      const newUser = {
        id: users.length + 1,
        email: newUserEmail,
        role: newUserRole,
        status: "active"
      };

      setUsers([...users, newUser]);

      toast({
        title: "User added",
        description: `User ${newUserEmail} has been added successfully`,
      });

      // Reset form
      setNewUserEmail("");
      setNewUserRole("user");
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add user',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStorageSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('storageLimit', storageLimit.toString());
      localStorage.setItem('autoCleanup', autoCleanup.toString());
      localStorage.setItem('cleanupDays', cleanupDays.toString());

      toast({
        title: "Storage settings saved",
        description: "Storage settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving storage settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save storage settings',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppearanceSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('animationsEnabled', animationsEnabled.toString());
      localStorage.setItem('highContrastMode', highContrastMode.toString());

      // Apply theme
      setTheme(themeMode);

      // Apply animations setting
      document.documentElement.classList.toggle('reduce-motion', !animationsEnabled);

      // Apply high contrast mode
      document.documentElement.classList.toggle('high-contrast', highContrastMode);

      toast({
        title: "Appearance settings saved",
        description: "Appearance settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save appearance settings',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('apiUrl', apiUrl);
      localStorage.setItem('apiKey', apiKey);
      localStorage.setItem('apiClientId', apiClientId);
      localStorage.setItem('apiClientSecret', apiClientSecret);

      // Update API configuration in the service
      xiboService.updateConfig({
        baseUrl: apiUrl,
        apiKey: apiKey,
        clientId: apiClientId,
        clientSecret: apiClientSecret
      });

      toast({
        title: "API settings saved",
        description: "API settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving API settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save API settings',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    // Apply animations setting
    document.documentElement.classList.toggle('reduce-motion', !animationsEnabled);

    // Apply high contrast mode
    document.documentElement.classList.toggle('high-contrast', highContrastMode);
  }, [animationsEnabled, highContrastMode]);

  return (
    <div className="space-y-6 animate-gentle-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center text-primary">
            <SettingsIcon className="mr-2 h-8 w-8 text-primary" /> Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-background/95 p-1 rounded-lg">
          <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <SettingsIcon className="mr-2 h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Lock className="mr-2 h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="mr-2 h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="storage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Database className="mr-2 h-4 w-4" /> Storage
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Palette className="mr-2 h-4 w-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Globe className="mr-2 h-4 w-4" /> API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="Africa/Casablanca">Africa/Casablanca</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <Switch
                    id="notifications"
                    checked={enableNotifications}
                    onCheckedChange={setEnableNotifications}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveGeneralSettings}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
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
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de sécurité</CardTitle>
              <CardDescription>
                Gérez les paramètres de sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="twoFactor">Authentification à deux facteurs</Label>
                  <Switch
                    id="twoFactor"
                    checked={twoFactorAuth}
                    onCheckedChange={setTwoFactorAuth}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveSecuritySettings}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>
                Gérez les comptes utilisateurs et les permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newUserEmail">Email du nouvel utilisateur</Label>
                  <Input
                    id="newUserEmail"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="userRole">Rôle de l'utilisateur</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="manager">Gestionnaire</SelectItem>
                      <SelectItem value="user">Utilisateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddUser}
                  disabled={loading || !newUserEmail}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    <>Ajouter un utilisateur</>
                  )}
                </Button>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="text-lg font-medium mb-2">Utilisateurs existants</h3>
                <div className="border rounded-md">
                  <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 font-medium">
                    <div>Email</div>
                    <div>Rôle</div>
                    <div>Statut</div>
                    <div className="text-right">Actions</div>
                  </div>
                  {users.map((user) => (
                    <div key={user.id} className="grid grid-cols-4 gap-4 p-3 border-t items-center">
                      <div>{user.email}</div>
                      <div>
                        <Badge variant={
                          user.role === "admin" ? "destructive" :
                            user.role === "manager" ? "default" : "outline"
                        }>
                          {user.role === "admin" ? "Administrateur" :
                            user.role === "manager" ? "Gestionnaire" : "Utilisateur"}
                        </Badge>
                      </div>
                      <div>
                        <Badge variant={user.status === "active" ? "success" : "secondary"}>
                          {user.status === "active" ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">Modifier</Button>
                        <Button variant="destructive" size="sm">Supprimer</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de stockage</CardTitle>
              <CardDescription>
                Gérez les options de stockage et de nettoyage automatique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="storageLimit">Limite de stockage (Mo)</Label>
                  <Input
                    id="storageLimit"
                    type="number"
                    value={storageLimit}
                    onChange={(e) => setStorageLimit(parseInt(e.target.value))}
                    min="100"
                    max="10000"
                  />
                  <p className="text-sm text-muted-foreground">
                    Limite maximale de stockage pour les médias et les fichiers
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoCleanup">Nettoyage automatique</Label>
                  <Switch
                    id="autoCleanup"
                    checked={autoCleanup}
                    onCheckedChange={setAutoCleanup}
                  />
                </div>
                {autoCleanup && (
                  <div className="grid gap-2">
                    <Label htmlFor="cleanupDays">Supprimer les fichiers après (jours)</Label>
                    <Input
                      id="cleanupDays"
                      type="number"
                      value={cleanupDays}
                      onChange={(e) => setCleanupDays(parseInt(e.target.value))}
                      min="1"
                      max="365"
                    />
                    <p className="text-sm text-muted-foreground">
                      Les fichiers non utilisés seront supprimés après cette période
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveStorageSettings}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the interface appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={themeMode} onValueChange={setThemeMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="animations">Animations</Label>
                  <Switch
                    id="animations"
                    checked={animationsEnabled}
                    onCheckedChange={setAnimationsEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="highContrast">High Contrast Mode</Label>
                  <Switch
                    id="highContrast"
                    checked={highContrastMode}
                    onCheckedChange={setHighContrastMode}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveAppearanceSettings}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
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
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>
                Configure connection settings for the Xibo API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://10.147.60.91:8080/api"
                  />
                  <p className="text-sm text-muted-foreground">
                    The base URL of your Xibo CMS API
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API Key (CMS Key)</Label>
                  <Input
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="XDz5Pfhx"
                  />
                  <p className="text-sm text-muted-foreground">
                    The API key provided by your Xibo CMS instance
                  </p>
                </div>
                <Separator className="my-2" />
                <div>
                  <h3 className="text-lg font-medium mb-2">OAuth2 Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These credentials are required for OAuth2 authentication with the Xibo API.
                    You can find them in your Xibo CMS under Applications {'->'} API Applications.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apiClientId">Client ID</Label>
                  <Input
                    id="apiClientId"
                    value={apiClientId}
                    onChange={(e) => setApiClientId(e.target.value)}
                    placeholder="Enter your Client ID"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apiClientSecret">Client Secret</Label>
                  <Input
                    id="apiClientSecret"
                    type="password"
                    value={apiClientSecret}
                    onChange={(e) => setApiClientSecret(e.target.value)}
                    placeholder="Enter your Client Secret"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveApiSettings}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
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
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
