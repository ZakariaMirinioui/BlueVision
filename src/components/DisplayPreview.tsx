
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Monitor, Clock, Calendar, RefreshCw, Loader2, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/StatusBadge";
import { xiboService } from '@/services/XiboAPI';

const DisplayPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayData, setDisplayData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    loadDisplayData();
  }, [id]);
  
  const loadDisplayData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get display data
      const displays = await xiboService.getDisplays();
      const display = displays.find((d: any) => d.id === id);
      
      if (!display) {
        setError(`Display ID ${id} not found`);
        return;
      }
      
      // Get display status
      const status = await xiboService.getDisplayStatus(id);
      
      // Combine the data
      setDisplayData({
        ...display,
        status: status.status,
        currentLayout: status.currentLayout,
        lastPing: status.lastPing,
        storagePercentage: status.storagePercentage
      });
      
    } catch (err: any) {
      console.error("Error loading display data:", err);
      setError(err.message || "Failed to load display data");
      toast({
        title: "Error",
        description: "Failed to load display data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDisplayData();
    setRefreshing(false);
    
    toast({
      title: "Display refreshed",
      description: "Display data has been refreshed",
    });
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading display data...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <p className="mt-4 text-lg text-destructive font-bold">Error</p>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => navigate(-1)} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }
  
  if (!displayData) return null;
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <Button onClick={() => navigate(-1)} variant="outline" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Displays
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Display Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="mr-2 h-5 w-5" />
              Display Information
            </CardTitle>
            <CardDescription>Current status and details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Display ID</p>
              <p className="font-mono text-sm">{displayData.id}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{displayData.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p>{displayData.location}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Group</p>
              <Badge variant="outline">{displayData.group_name}</Badge>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <StatusBadge status={displayData.status as "online" | "warning" | "offline"} />
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(displayData.lastPing)}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${displayData.storagePercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>{displayData.storagePercentage}%</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleRefresh} variant="outline" className="w-full" disabled={refreshing}>
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Display Preview Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="mr-2 h-5 w-5" />
              Live Display Preview
            </CardTitle>
            <CardDescription>
              Currently showing: {displayData.currentLayout || "No content"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] border rounded-md flex items-center justify-center overflow-hidden">
              {displayData.currentLayout && displayData.currentLayout.includes("Message") ? (
                <div className="p-4 h-full w-full flex items-center justify-center">
                  <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg mx-auto text-center">
                    <h2 className="text-2xl font-bold mb-4">{displayData.currentLayout.replace(" (Message)", "")}</h2>
                    <p className="text-gray-700">
                      This is a message currently being displayed on the screen.
                      In a real environment, the actual content would be shown here.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{formatDate(displayData.lastPing)}</span>
                    </div>
                  </div>
                </div>
              ) : displayData.currentLayout && displayData.currentLayout.includes("Media") ? (
                <div className="p-4 h-full w-full flex items-center justify-center">
                  <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg mx-auto text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h2 className="text-2xl font-bold mb-4">{displayData.currentLayout.replace("Media: ", "")}</h2>
                    <p className="text-gray-700">
                      This display is currently showing media content.
                      In a real environment, the actual media would be rendered here.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{formatDate(displayData.lastPing)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 h-full w-full flex items-center justify-center">
                  <div className="bg-muted/30 p-8 text-center rounded-md">
                    <Monitor className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="mt-4">No content is currently being displayed</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Use the Message or Media Library to assign content to this display
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DisplayPreview;
