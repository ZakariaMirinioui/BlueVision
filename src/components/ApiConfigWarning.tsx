import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const ApiConfigWarning = () => {
  // Always consider API as configured for now
  const [configStatus, setConfigStatus] = useState<{ isConfigured: boolean, error: string | null }>({
    isConfigured: true,
    error: null
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setConfigStatus({ isConfigured: true, error: null });
    const isDismissed = localStorage.getItem('api_warning_dismissed') === 'true';
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('api_warning_dismissed', 'true');
    setDismissed(true);
  };

  if (configStatus.isConfigured || dismissed) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/30">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1">
        <AlertTitle>Configuration API requise</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-2">
            L'application fonctionne actuellement en mode démonstration avec des données simulées.
            Pour activer toutes les fonctionnalités, configurez les variables d'environnement suivantes :
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li><code className="bg-destructive/20 px-1 rounded">VITE_XIBO_API_CLIENT_ID</code></li>
            <li><code className="bg-destructive/20 px-1 rounded">VITE_XIBO_API_CLIENT_SECRET</code></li>
          </ul>
          <p className="text-sm opacity-80 mb-3">
            Erreur: {configStatus.error || "Configuration API manquante"}
          </p>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              Ignorer ce message
            </Button>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default ApiConfigWarning;
