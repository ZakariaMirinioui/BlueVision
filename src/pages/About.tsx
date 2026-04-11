import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Globe, Database, Palette, Code2, Box, Library, Server } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { xiboService } from "@/services/XiboAPI";
import { useEffect, useState } from "react";

const About = () => {
    const { toast } = useToast();
    const [apiSettings, setApiSettings] = useState({
        serverUrl: "http://10.147.60.91:8080/api",
        cmsKey: "XDz5Pfhx"
    });

    const systemInfo = {
        companyName: "Brinks Maroc",
        appName: "SecureCMS - Enterprise Security Digital Signage Management",
        version: "1.0.0",
        environment: "Production",
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: `${label} has been copied to clipboard`,
        });
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">About System</h1>
                <Badge variant="outline">{systemInfo.environment}</Badge>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                        <CardDescription>Details about your organization</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-2">Company Name</h3>
                            <p className="text-muted-foreground">{systemInfo.companyName}</p>
                        </div>
                        <div>
                            <h3 className="font-medium mb-2">System Name</h3>
                            <p className="text-muted-foreground">{systemInfo.appName}</p>
                        </div>
                        <div>
                            <h3 className="font-medium mb-2">Version</h3>
                            <p className="text-muted-foreground">{systemInfo.version}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>CMS Connection Details</CardTitle>
                        <CardDescription>Information needed to connect displays to this CMS</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-2">CMS Server URL</h3>
                            <div className="flex items-center space-x-2">
                                <code className="bg-muted px-2 py-1 rounded">{apiSettings.serverUrl}</code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopy(apiSettings.serverUrl, "Server URL")}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium mb-2">CMS Key</h3>
                            <div className="flex items-center space-x-2">
                                <code className="bg-muted px-2 py-1 rounded">{apiSettings.cmsKey}</code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopy(apiSettings.cmsKey, "CMS Key")}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Information</CardTitle>
                        <CardDescription>Technical details about the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium mb-2">Server Environment</h3>
                                <p className="text-muted-foreground">{systemInfo.environment}</p>
                            </div>
                            <div>
                                <h3 className="font-medium mb-2">Technologies</h3>
                                <ul className="space-y-3 text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <Code2 className="h-4 w-4 text-blue-500" />
                                        Frontend: React with TypeScript
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Palette className="h-4 w-4 text-purple-500" />
                                        UI Framework: Tailwind CSS with shadcn/ui
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Box className="h-4 w-4 text-orange-500" />
                                        State Management: React Query & Zustand
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Database className="h-4 w-4 text-green-500" />
                                        Database: Supabase
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Server className="h-4 w-4 text-indigo-500" />
                                        CMS: Xibo Digital Signage
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Creator Information */}
                <Card className="border-blue-200 dark:border-blue-900">
                    <CardHeader>
                        <CardTitle>Creator Information</CardTitle>
                        <CardDescription>Project creator and acknowledgments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-2">Creator & Owner</h3>
                            <p className="text-muted-foreground">Zakaria Mirinioui</p>
                        </div>
                        <div>
                            <h3 className="font-medium mb-2">Special Thanks</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">Contributor</Badge>
                                    <span className="text-muted-foreground">Fouad Ibnelhaj</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">Contributor</Badge>
                                    <span className="text-muted-foreground">Driss Saghrouchi</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default About;