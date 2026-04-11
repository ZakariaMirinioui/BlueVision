import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { notifyAndLog } from '@/utils/notifyAndLog';

interface MediaUploadProps {
  onMediaAdded: () => Promise<void>;
  accept?: string;
  maxSize?: number;
  preview?: boolean;
}

export default function MediaUpload({
  onMediaAdded,
  accept = "image/*,video/*",
  maxSize = 10,
  preview = true
}: MediaUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaName, setMediaName] = useState<string>("");
  const [mediaDescription, setMediaDescription] = useState<string>("");

  // Get extension from selected file
  const fileExt = selectedFile ? (selectedFile.name.includes('.') ? selectedFile.name.substring(selectedFile.name.lastIndexOf('.')) : '') : '';

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const file = selectedFile;
      const filePath = file.name;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { publicUrl } = supabase.storage.from('media').getPublicUrl(filePath).data;
      if (!publicUrl) throw new Error('Failed to get public URL for uploaded file');

      // Get the current max id from the media table
      const { data: maxMedia, error: fetchError } = await supabase
        .from('media')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
      if (fetchError) throw fetchError;
      let nextId = 1;
      if (maxMedia && maxMedia.length > 0 && typeof maxMedia[0].id === 'number') {
        nextId = maxMedia[0].id + 1;
      }
      // Insert into media table and return the inserted row
      // --- Get current user_id from localStorage ---
      // Get user_id from localStorage (should be users.id, not auth_uid)
      let user_id = null;
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user && (user.id !== undefined && user.id !== null)) {
          user_id = user.id;
        }
      } catch (e) {
        user_id = null;
      }
      if (!user_id && supabase && supabase.auth) {
        try {
          const { data } = await supabase.auth.getUser();
          user_id = data?.user?.id || null;
        } catch {
          // ignore error
        }
      }
      if (!user_id) {
        throw new Error('User not found in session. Please log in again.');
      }
      // Compose the final name with extension
      const finalName = (mediaName.trim() ? mediaName.trim() : file.name.replace(fileExt, '')) + fileExt;
      const { data: inserted, error: dbError } = await supabase
        .from('media')
        .insert({
          id: nextId,
          name: finalName,
          type: file.type.split('/')[0],
          file_size: file.size,
          file_url: publicUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id
        })
        .select()
        .single();
      if (dbError) throw dbError;
      if (!inserted) throw new Error('Media insert failed');

      toast({
        title: "Upload Complete",
        description: "Media file has been uploaded successfully"
      });
      // Log activity for media upload
      await notifyAndLog({
        title: 'Media Uploaded',
        message: `Media "${finalName}" was uploaded by the user`,
        type: 'upload',
        action_type: 'upload',
        entity: 'media',
        entity_id: inserted.id,
        user_id: user_id,
        meta: { media: inserted }
      });
      await onMediaAdded();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file"
      });
      await onMediaAdded();
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileName(null);
      setUploadProgress(0);
    }
  }, [selectedFile, onMediaAdded, toast, mediaName, fileExt]);

  // Set initial media name when file is selected
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const validTypes = accept.split(',').map(type => type.trim());
    const fileType = file.type;
    const isValidType = validTypes.some(type => {
      if (type.includes('/*')) {
        return fileType.startsWith(type.replace('/*', ''));
      }
      return type === fileType;
    });

    if (!isValidType) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: `File type must be one of: ${validTypes.join(', ')}`
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`
      });
      return;
    }

    setSelectedFile(file);
    // Set the input value to the filename (without extension) only if not already set for this file
    setMediaName(file.name.replace(/\.[^/.]+$/, ""));
    if (preview) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, [accept, maxSize, preview, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.split(',').reduce((acc, type) => {
      acc[type.trim()] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSize * 1024 * 1024,
    multiple: false
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        {selectedFile && previewUrl ? (
          <div className="space-y-4">
            {previewUrl.startsWith('data:video/') ? (
              <video src={previewUrl} className="w-full h-full object-contain" controls />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Please select a file to save as media.
            </p>
          </div>
        )}
      </div>
      {/* Media info form - only fields that exist in the table */}
      {selectedFile && (
        <div className="space-y-2 text-left text-xs text-muted-foreground">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">Media Name</label>
            <div className="flex items-center gap-2">
              <input
                className="border rounded px-2 py-1 text-base flex-1"
                value={mediaName}
                onChange={e => setMediaName(e.target.value)}
                placeholder={selectedFile.name.replace(/\.[^/.]+$/, "")}
                maxLength={100}
                disabled={isUploading}
                style={{ minWidth: 0 }}
              />
              <span className="text-xs text-muted-foreground select-none">{fileExt}</span>
            </div>
          </div>
          <div><b>Type:</b> {selectedFile.type}</div>
          <div><b>Size:</b> {selectedFile.size} bytes</div>
        </div>
      )}
      {selectedFile && previewUrl && (
        <Button onClick={handleFileUpload} disabled={isUploading} className="mt-4 w-full">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          {isUploading ? "Saving..." : "Save Media"}
        </Button>
      )}
    </div>
  );
}
