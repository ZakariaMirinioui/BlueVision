import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { supabase } from '@/lib/supabaseClient';
import { MediaItem } from '@/types/media';
import { FileVideo, Image as ImageIcon, File, Plus } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import MediaUpload from './MediaUpload';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

const getMediaIcon = (type: string, fileType?: string) => {
  if (type === 'video' || fileType?.startsWith('video/')) {
    return <FileVideo className="w-4 h-4" />;
  }
  if (type === 'image' || fileType?.startsWith('image/')) {
    return <ImageIcon className="w-4 h-4" />;
  }
  return <File className="w-4 w-4" />;
};

interface MediaDialogProps {
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

export function MediaDialog({
  selectedIds,
  onSelect
}: MediaDialogProps) {
  const [activeTab, setActiveTab] = useState('browse');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>(selectedIds);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaItems(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMedia = (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter(i => i !== id)
      : [...selected, id];
    setSelected(newSelected);
    onSelect(newSelected);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds]);

  return (
    <Tabs defaultValue="browse" className="w-full" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="browse">Browse Media</TabsTrigger>
        <TabsTrigger value="upload">Upload New</TabsTrigger>
      </TabsList>

      <TabsContent value="browse" className="mt-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
              {mediaItems.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">No media items found</p>
                  <Button variant="outline" onClick={() => setActiveTab('upload')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Media
                  </Button>
                </div>
              ) : (
                mediaItems.map(item => (
                  <div
                    key={item.id}
                    className="relative group cursor-pointer"
                    onClick={() => handleToggleMedia(item.id.toString())}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selected.includes(item.id.toString())}
                        onCheckedChange={() => handleToggleMedia(item.id.toString())}
                      />
                    </div>
                    <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                      {item.media_type === 'image' || item.file_type?.startsWith('image/') ? (
                        <img
                          src={item.file_url || '/placeholder.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : item.media_type === 'video' || item.file_type?.startsWith('video/') ? (
                        <video
                          src={item.file_url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          {getMediaIcon(item.media_type, item.file_type)}
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-sm truncate">{item.name}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </TabsContent>

      <TabsContent value="upload" className="mt-0">
        <MediaUpload
          onMediaAdded={async () => {
            await fetchMedia();
            setActiveTab('browse');
          }}
          accept="image/*,video/*"
          maxSize={10}
          preview={true}
        />
      </TabsContent>
    </Tabs>
  );
}
