import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Layers,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Grid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaDialog } from "@/components/MediaDialog";
import { Layout, LayoutStatus } from '@/types/layout-media';
import { MediaItem } from '@/types/media';
import { supabase } from "@/lib/supabaseClient";
import { notifyAndLog } from '@/utils/notifyAndLog';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MediaLayoutTemplate from "@/components/MediaLayoutTemplate";

interface LayoutWithMedia extends Layout {
  media: (MediaItem & { position?: number })[];
  mediaByZone?: Record<string, MediaItem[]>;
  gridTemplate?: typeof gridTemplates[number];
}

// 1. Add types for new structure
interface LayoutMedia {
  id: number;
  layout_id: number;
  media_id: number;
  zone: string;
  position: number;
  media: MediaItem;
}

// ------------- GRID TEMPLATES -------------
const gridTemplates = [
  {
    id: 'template-1',
    label: '3x1 Simple',
    zones: ['zone-1', 'zone-2', 'zone-3'],
    gridClass: 'grid-cols-3 grid-rows-1',
    preview: (
      <div className="grid grid-cols-3 gap-1 w-24 h-8">
        <div className="border border-black bg-gray-100" />
        <div className="border border-black bg-gray-100" />
        <div className="border border-black bg-gray-100" />
      </div>
    )
  },
  {
    id: 'template-2',
    label: '2x2 Grid',
    zones: ['zone-1', 'zone-2', 'zone-3', 'zone-4'],
    gridClass: 'grid-cols-2 grid-rows-2',
    preview: (
      <div className="grid grid-cols-2 gap-1 w-16 h-10">
        <div className="border border-black bg-gray-100" />
        <div className="border border-black bg-gray-100" />
        <div className="border border-black bg-gray-100" />
        <div className="border border-black bg-gray-100" />
      </div>
    )
  },
  {
    id: 'template-3',
    label: 'Magazine',
    zones: ['zone-1', 'zone-2', 'zone-3', 'zone-4', 'zone-5'],
    gridClass: 'grid-cols-3 grid-rows-3',
    preview: (
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-24 h-16">
        <div className="border border-black bg-gray-100 col-span-2 row-span-2" />
        <div className="border border-black bg-gray-100 col-span-1 row-span-1 col-start-3 row-start-1" />
        <div className="border border-black bg-gray-100 col-span-1 row-span-1 col-start-3 row-start-2" />
        <div className="border border-black bg-gray-100 col-span-1 row-span-1 col-start-1 row-start-3" />
        <div className="border border-black bg-gray-100 col-span-2 row-span-1 col-start-2 row-start-3" />
      </div>
    ),
    // For rendering, provide a map of zoneId to grid-area classes
    zoneGrid: {
      'zone-1': 'col-span-2 row-span-2',
      'zone-2': 'col-start-3 row-start-1',
      'zone-3': 'col-start-3 row-start-2',
      'zone-4': 'col-start-1 row-start-3',
      'zone-5': 'col-start-2 row-start-3 col-span-2',
    }
  },
  {
    id: 'template-4',
    label: '1x4 Vertical',
    zones: ['zone-1', 'zone-2', 'zone-3', 'zone-4'],
    gridClass: 'grid-cols-1 grid-rows-4',
    preview: (
      <div className="grid grid-cols-1 gap-1 w-8 h-20">
        <div className="border border-black bg-gray-100" />
        <div className="border border-black bg-gray-100" />
        <div className="border border-black bg-gray-100" />
        <div className="border border-black bg-gray-100" />
      </div>
    )
  },
];

const Layouts = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [layouts, setLayouts] = useState<LayoutWithMedia[]>([]);
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [layoutToDelete, setLayoutToDelete] = useState<LayoutWithMedia | null>(null);
  const [editingLayout, setEditingLayout] = useState<LayoutWithMedia | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [viewingLayoutMedia, setViewingLayoutMedia] = useState<MediaItem[]>([]);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [zoneMedia, setZoneMedia] = useState<Record<string, MediaItem | null>>({});
  const [viewingLayout, setViewingLayout] = useState<LayoutWithMedia | null>(null);
  const initialLayoutRef = useRef<LayoutWithMedia | null>(null);
  const initialMediaIdsRef = useRef<string[]>([]);

  const [selectedGrid, setSelectedGrid] = useState(gridTemplates[0]);
  const [showFullScreenPreview, setShowFullScreenPreview] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gridFilter, setGridFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const zones = [
    { id: 'zone-1', label: 'Zone 1' },
    { id: 'zone-2', label: 'Zone 2' },
    { id: 'zone-3', label: 'Zone 3' },
  ];

  // --- FIX: Fetch all layout_media associations and group strictly by zone ---
  const fetchLayouts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: layoutsData, error } = await supabase
        .from('layouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching layouts:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch layouts from the database."
        });
        setLayouts([]);
        return;
      }

      // For each layout, fetch its media associations
      const layoutsWithMedia = await Promise.all(
        (layoutsData || []).map(async (layout) => {
          // @ts-expect-error: Custom table not in generated types
          const { data: layoutMediaLinks } = await (supabase
            .from('layout_media' as unknown as string)
            .select('id, layout_id, media_id, zone, position, media:media_id(*)')
            .eq('layout_id', layout.id)
            .order('zone')
            .order('position'));

          // Group media by zone (strictly, do not deduplicate by media)
          const mediaByZone: Record<string, MediaItem[]> = {};
          (layoutMediaLinks || []).forEach((link: { zone: string; media: MediaItem }) => {
            if (!mediaByZone[link.zone]) mediaByZone[link.zone] = [];
            if (link.media) mediaByZone[link.zone].push(link.media);
          });

          // Attach gridTemplate for rendering
          const gridTemplate = gridTemplates.find(t => t.id === (layout as any).grid_template_id) || gridTemplates[0];

          return {
            ...layout,
            media: [], // Patch: always provide media array for type
            mediaByZone,
            gridTemplate,
          } as LayoutWithMedia;
        })
      );

      setLayouts(layoutsWithMedia);
    } catch (error) {
      console.error("Error in fetchLayouts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch layouts."
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchAllMedia = useCallback(async () => {
    const { data, error } = await supabase.from('media').select('*').order('created_at', { ascending: false });
    if (!error && data) setAllMedia(data);
  }, []);

  useEffect(() => {
    fetchLayouts();
    fetchAllMedia();
  }, [fetchLayouts, fetchAllMedia]);

  // Handle URL parameters for automatic dialog opening
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setIsCreateDialogOpen(true);
      // Remove the parameter from URL after opening dialog
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Ensure only valid status values are used
  const allowedStatuses = ['draft', 'online', 'offline', 'warning'];

  // --- FIX: Use selectedGrid.zones for dynamic zone count ---
  const handleCreateLayout = async () => {
    if (!editingLayout?.name) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Layout name is required"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Use a valid status value
      const status = allowedStatuses.includes(editingLayout.status) ? editingLayout.status : 'draft';
      // --- Get current user_id from localStorage ---
      let user_id = null;
      try {
        const user = JSON.parse(localStorage.getItem('xibo_user') || '{}');
        user_id = user.auth_uid || user.id || null;
      } catch { }
      // Fallback: try to get from Supabase Auth if not found
      if (!user_id && supabase && supabase.auth) {
        try {
          const { data } = await supabase.auth.getUser();
          user_id = data?.user?.id || null;
        } catch { }
      }
      if (!user_id) {
        throw new Error('User not found in session. Please log in again.');
      }
      const layoutData = {
        name: editingLayout.name.trim(),
        description: editingLayout.description?.trim() || '',
        duration: editingLayout.duration || 0,
        status, // always valid
        resolution: editingLayout.resolution || '1920x1080',
        creator: editingLayout.creator || '',
        category: editingLayout.category || '',
        thumbnail_url: editingLayout.thumbnail_url || '',
        in_use: false,
        times_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        grid_template_id: selectedGrid.id, // Save the grid template ID
        user_id // <-- inject user_id
      };

      const { data: newLayout, error: layoutError } = await supabase
        .from('layouts')
        .insert([layoutData])
        .select()
        .single();

      if (layoutError || !newLayout) {
        throw new Error(layoutError?.message || 'Failed to create layout');
      }

      // Fetch username from Supabase for notification
      let username = '';
      try {
        const { data, error } = await supabase.from('users').select('username').eq('auth_uid', user_id).single();
        if (!error && data && data.username) username = data.username;
      } catch { }
      await notifyAndLog({
        title: 'Layout Created',
        message: `Layout "${layoutData.name}" was created by ${username || 'Unknown User'}`,
        type: 'success',
        action_type: 'create',
        entity: 'layout',
        entity_id: newLayout.id,
        user_id: user_id,
        meta: { layout: layoutData }
      });

      // --- Patch: If no zoneMedia but mediaIds exist, associate all selected media to the first zone ---
      let layoutMediaRows: any[] = [];
      if (Object.values(zoneMedia).some(Boolean)) {
        layoutMediaRows = selectedGrid.zones.map(zoneId => {
          const media = zoneMedia[zoneId];
          if (media) {
            return {
              layout_id: newLayout.id,
              media_id: media.id,
              zone: zoneId,
              position: 0
            };
          }
          return null;
        }).filter(Boolean);
      } else if (mediaIds.length > 0) {
        // fallback: assign all selected media to the first zone
        layoutMediaRows = mediaIds.map((id, idx) => ({
          layout_id: newLayout.id,
          media_id: Number(id),
          zone: selectedGrid.zones[0],
          position: idx
        }));
      }
      if (layoutMediaRows.length > 0) {
        // @ts-expect-error: Custom table not in generated types
        await supabase.from('layout_media' as unknown as string).insert(layoutMediaRows);
      }

      await fetchLayouts();
      setIsCreateDialogOpen(false);
      setEditingLayout(null);
      setZoneMedia({});
      setShowBackConfirm(false);

      toast({
        title: "Layout Created",
        description: `"${layoutData.name}" has been created successfully.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Layout creation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create layout"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- FIX: Use selectedGrid.zones for dynamic zone count ---
  const handleEditSave = async (updatedLayout: LayoutWithMedia) => {
    try {
      if (!updatedLayout?.name) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Layout name is required"
        });
        return;
      }

      setIsSaving(true);

      // Use a valid status value
      const status = allowedStatuses.includes(updatedLayout.status) ? updatedLayout.status : 'draft';
      await supabase
        .from('layouts')
        .update({
          name: updatedLayout.name,
          description: updatedLayout.description,
          status, // always valid
          resolution: updatedLayout.resolution,
          in_use: updatedLayout.in_use,
          updated_at: new Date().toISOString(),
          grid_template_id: selectedGrid.id, // Save the grid template ID
        })
        .eq('id', updatedLayout.id);

      // Remove all previous associations for this layout
      // @ts-expect-error: Custom table not in generated types
      await (supabase.from('layout_media' as unknown as string).delete().eq('layout_id', updatedLayout.id));

      // --- FIX: Insert a row for every zone/media assignment, even if media is duplicated ---
      const layoutMediaRows = selectedGrid.zones.map(zoneId => {
        const media = zoneMedia[zoneId];
        if (media) {
          return {
            layout_id: updatedLayout.id,
            media_id: media.id,
            zone: zoneId,
            position: 0
          };
        }
        return null;
      }).filter(Boolean);
      if (layoutMediaRows.length > 0) {
        // @ts-expect-error: Custom table not in generated types
        await supabase.from('layout_media' as unknown as string).insert(layoutMediaRows);
      }

      await fetchLayouts();
      setIsEditDialogOpen(false);
      setEditingLayout(null);
      setMediaIds([]);
      // Log activity for layout edit
      let user_id = null;
      try {
        const user = JSON.parse(localStorage.getItem('xibo_user') || '{}');
        user_id = user.auth_uid || user.id || null;
      } catch { }
      if (!user_id && supabase && supabase.auth) {
        try {
          const { data } = await supabase.auth.getUser();
          user_id = data?.user?.id || null;
        } catch { }
      }
      // Fetch username from Supabase for notification
      let username = '';
      try {
        const { data, error } = await supabase.from('users').select('username').eq('auth_uid', user_id).single();
        if (!error && data && data.username) username = data.username;
      } catch { }
      await notifyAndLog({
        title: 'Layout Modified',
        message: `Layout "${updatedLayout.name}" was modified by ${username || 'Unknown User'}`,
        type: 'info',
        action_type: 'edit',
        entity: 'layout',
        entity_id: updatedLayout.id,
        user_id: user_id,
        meta: { layout: updatedLayout }
      });
      toast({
        title: "Success",
        description: `Layout "${updatedLayout.name}" updated successfully.`
      });
    } catch (error) {
      console.error('Error updating layout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update layout.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLayout = async (layout: LayoutWithMedia) => {
    setLayoutToDelete(layout);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!layoutToDelete) return;

    setIsDeleting(true);
    try {
      // First delete all media associations
      await supabase
        .from('layout_media')
        .delete()
        .eq('layout_id', layoutToDelete.id);

      // Then delete the layout itself
      const { error } = await supabase
        .from('layouts')
        .delete()
        .eq('id', layoutToDelete.id);

      if (error) throw error;

      setLayouts(prev => prev.filter(l => l.id !== layoutToDelete.id));
      toast({
        title: "Success",
        description: `Layout "${layoutToDelete.name}" has been deleted.`
      });
      // Log activity for layout deletion
      let user_id = null;
      try {
        const user = JSON.parse(localStorage.getItem('xibo_user') || '{}');
        user_id = user.auth_uid || user.id || null;
      } catch { }
      if (!user_id && supabase && supabase.auth) {
        try {
          const { data } = await supabase.auth.getUser();
          user_id = data?.user?.id || null;
        } catch { }
      }
      // Fetch username from Supabase for notification
      let username = '';
      try {
        const { data, error } = await supabase.from('users').select('username').eq('auth_uid', user_id).single();
        if (!error && data && data.username) username = data.username;
      } catch { }
      await notifyAndLog({
        title: 'Layout Deleted',
        message: `Layout "${layoutToDelete.name}" was deleted by ${username || 'Unknown User'}`,
        type: 'error',
        action_type: 'delete',
        entity: 'layout',
        entity_id: layoutToDelete.id,
        user_id: user_id,
        meta: { layout: layoutToDelete }
      });
    } catch (error) {
      console.error('Error deleting layout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete layout. Please try again."
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setLayoutToDelete(null);
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      if (hasUnsavedChanges()) {
        setShowBackConfirm(true);
      } else {
        closeDialog();
      }
    }
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingLayout(null);
    setMediaIds([]);
    setShowBackConfirm(false);
  };

  const discardChanges = () => {
    closeDialog();
    setShowBackConfirm(false);
  };

  const hasUnsavedChanges = () => {
    if (!editingLayout) return false;
    const initial = initialLayoutRef.current;
    const initialMedia = initialMediaIdsRef.current;
    return (
      editingLayout.name !== initial?.name ||
      editingLayout.description !== initial?.description ||
      editingLayout.status !== initial?.status ||
      editingLayout.resolution !== initial?.resolution ||
      JSON.stringify(mediaIds) !== JSON.stringify(initialMedia)
    );
  };

  const openCreateDialog = () => {
    const emptyLayout: LayoutWithMedia = {
      id: 0,
      name: '',
      description: '',
      status: 'draft' as LayoutStatus,
      resolution: '1920x1080',
      in_use: false,
      media: [],
      created_at: new Date().toISOString()
    };
    setEditingLayout(emptyLayout);
    setMediaIds([]);
    initialLayoutRef.current = emptyLayout;
    initialMediaIdsRef.current = [];
    setIsCreateDialogOpen(true);
  };

  // Add this function to handle media insertion and association
  async function insertMediaAndAssociations({ layoutId, zoneMedia }: { layoutId: number, zoneMedia: Record<string, { file_url: string, name: string, type: string }[]> }) {
    for (const [zone, mediaArr] of Object.entries(zoneMedia)) {
      for (let i = 0; i < mediaArr.length; i++) {
        const media = mediaArr[i];
        // 1. Insert media if not already present (by file_url)
        const { data: existingMedia } = await supabase
          .from('media')
          .select('id')
          .eq('file_url', media.file_url)
          .single();
        let mediaId = existingMedia?.id;
        if (!mediaId) {
          const { data: newMedia, error: mediaError } = await supabase
            .from('media')
            .insert({ file_url: media.file_url, name: media.name, type: media.type })
            .select()
            .single();
          if (mediaError || !newMedia) throw new Error('Failed to insert media');
          mediaId = newMedia.id;
        }
        // 2. Insert into layout_media
        const { error: assocError } = await supabase
          // @ts-expect-error: Custom table not in generated types
          .from('layout_media')
          .insert({ layout_id: layoutId, media_id: mediaId, zone, position: i });
        if (assocError) throw new Error('Failed to associate media with layout');
      }
    }
  }

  // --- Filtering logic ---
  const filteredLayouts = layouts.filter((layout) => {
    const matchesSearch = layout.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || layout.status === statusFilter;
    const matchesGrid = gridFilter === "all" || layout.gridTemplate?.id === gridFilter;
    return matchesSearch && matchesStatus && matchesGrid;
  });

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 items-center">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
            <span className="sr-only">List view</span>
          </Button>
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>
          {/* Grid Filter */}
          <Select value={gridFilter} onValueChange={setGridFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by grid" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grids</SelectItem>
              {gridTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>{template.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search layouts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Layouts</h2>
          <p className="text-muted-foreground">Create and manage content layouts for your digital signage displays.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={openCreateDialog} data-tour="create-layout">
            <Plus className="h-4 w-4 mr-2" />
            Create Layout
          </Button>
          {/* Removed Create Sample Layouts button */}
        </div>
      </div>

      {/* Layouts List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading layouts...</p>
          </div>
        </div>
      ) : filteredLayouts.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4">
            {filteredLayouts.map((layout) => (
              <Card key={layout.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-96 h-64 md:h-auto relative bg-muted flex items-center justify-center">
                    <div className={`grid gap-2 bg-white p-2 rounded border ${layout.gridTemplate.gridClass}`} style={{ width: '100%', height: '220px', minHeight: '180px' }}>
                      {layout.gridTemplate.zones.map(zoneId => (
                        <div
                          key={zoneId}
                          className={layout.gridTemplate.zoneGrid ? layout.gridTemplate.zoneGrid[zoneId] + ' border border-black flex items-center justify-center bg-white' : 'border border-black flex items-center justify-center bg-white'}
                          style={{ minHeight: 60, minWidth: 60, width: '100%', height: '100%' }}
                        >
                          {layout.mediaByZone[zoneId] && layout.mediaByZone[zoneId].length > 0 ? (
                            layout.mediaByZone[zoneId][0].type === 'image' ? (
                              <img key={zoneId} src={layout.mediaByZone[zoneId][0].file_url} alt={layout.mediaByZone[zoneId][0].name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : layout.mediaByZone[zoneId][0].type === 'video' ? (
                              <video key={zoneId} src={layout.mediaByZone[zoneId][0].file_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls />
                            ) : null
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-semibold">{layout.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {layout.description || "No description"}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <div className="text-sm text-muted-foreground">
                            Status: <span className={layout.status === 'online' ? 'text-green-500' : 'text-yellow-500'}>
                              {layout.status}
                            </span>
                          </div>
                          {layout.resolution && (
                            <div className="text-sm text-muted-foreground">
                              Resolution: {layout.resolution}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingLayout(layout);
                            initialLayoutRef.current = layout;
                            setMediaIds(layout.media?.map(m => m.id.toString()) || []);
                            // Set the correct grid template
                            if (layout.gridTemplate) {
                              setSelectedGrid(layout.gridTemplate);
                            } else {
                              setSelectedGrid(gridTemplates[0]);
                            }
                            // Set the correct zone media
                            if (layout.mediaByZone) {
                              setZoneMedia(() => {
                                const zoneMap: Record<string, MediaItem | null> = {};
                                for (const zone of Object.keys(layout.mediaByZone!)) {
                                  zoneMap[zone] = layout.mediaByZone![zone][0] || null;
                                }
                                // Ensure all zones for the grid are present
                                layout.gridTemplate?.zones.forEach(zid => {
                                  if (!(zid in zoneMap)) zoneMap[zid] = null;
                                });
                                return zoneMap;
                              });
                            } else {
                              setZoneMedia({});
                            }
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewingLayout(layout);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Media
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDeleteLayout(layout)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-md border mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left font-medium">Name</th>
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                  <th className="py-3 px-4 text-left font-medium">Grid</th>
                  <th className="py-3 px-4 text-left font-medium">Resolution</th>
                  <th className="py-3 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLayouts.map((layout) => (
                  <tr key={layout.id} className="border-b last:border-0">
                    <td className="py-3 px-4 font-medium">{layout.name}</td>
                    <td className="py-3 px-4">{layout.status}</td>
                    <td className="py-3 px-4">{layout.gridTemplate?.label}</td>
                    <td className="py-3 px-4">{layout.resolution}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingLayout(layout); initialLayoutRef.current = layout; setMediaIds(layout.media?.map(m => m.id.toString()) || []); setIsEditDialogOpen(true); }}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => { setViewingLayout(layout); setIsViewDialogOpen(true); }}><Eye className="h-4 w-4 mr-2" />View</Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDeleteLayout(layout)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No layouts yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get started by creating your first layout
            </p>
            <Button onClick={openCreateDialog} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Layout
            </Button>
          </div>
        </Card>
      )}

      {/* Create/Edit Layout Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6">
            <DialogTitle>
              {isCreateDialogOpen ? 'Create New Layout' : 'Edit Layout'}
            </DialogTitle>
            <DialogDescription>
              {isCreateDialogOpen
                ? 'Create a new layout and add media content to it'
                : 'Modify layout details and media content'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <Tabs defaultValue="details" className="w-full space-y-6">
              {/* Only show Layout Details tab */}
              <TabsList className="w-full">
                <TabsTrigger value="details">Layout Details</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter layout name"
                      value={editingLayout?.name || ''}
                      onChange={(e) =>
                        setEditingLayout((prev) => prev ? ({
                          ...prev,
                          name: e.target.value,
                        }) : null)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter layout description"
                      value={editingLayout?.description || ''}
                      onChange={(e) =>
                        setEditingLayout((prev) => prev ? ({
                          ...prev,
                          description: e.target.value,
                        }) : null)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editingLayout?.status || 'draft'}
                      onValueChange={(value: LayoutStatus) =>
                        setEditingLayout((prev) => prev ? ({
                          ...prev,
                          status: value,
                        }) : null)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution</Label>
                    <Select
                      value={editingLayout?.resolution || '1920x1080'}
                      onValueChange={(value) =>
                        setEditingLayout((prev) => prev ? ({
                          ...prev,
                          resolution: value,
                        }) : null)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                        <SelectItem value="3840x2160">3840x2160 (4K)</SelectItem>
                        <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grid Template Selector */}
                  <div className="space-y-2 mb-4">
                    <Label>Layout Grid Template</Label>
                    <div className="flex gap-4 flex-wrap">
                      {gridTemplates.map(template => (
                        <Button
                          key={template.id}
                          variant={selectedGrid.id === template.id ? 'default' : 'outline'}
                          onClick={() => {
                            setSelectedGrid(template);
                            // Reset zoneMedia for new template
                            setZoneMedia(z => {
                              const newZones: Record<string, MediaItem | null> = {};
                              template.zones.forEach(zid => { newZones[zid] = null; });
                              return newZones;
                            });
                          }}
                          className="flex flex-col items-center p-2 border border-gray-300 shadow-sm hover:shadow-lg transition-all"
                        >
                          {template.preview}
                          <span className="text-xs mt-1">{template.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Zone Media Selector UI */}
                  <div className="grid gap-4 mt-4">
                    {selectedGrid.zones.map(zoneId => (
                      <div key={zoneId} className="flex flex-col gap-2">
                        <label className="font-medium">{zoneId.replace('zone-', 'Zone ')}</label>
                        <div className="grid grid-cols-4 gap-2">
                          {allMedia.map(m => (
                            <div
                              key={m.id}
                              className={`relative border rounded p-1 cursor-pointer transition-all ${zoneMedia[zoneId]?.id === m.id ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-accent'}`}
                              onClick={() => setZoneMedia(z => ({ ...z, [zoneId]: m }))}
                              onMouseEnter={e => {
                                const tooltip = document.createElement('div');
                                tooltip.className = 'fixed z-50 p-2 bg-white border rounded shadow text-xs';
                                tooltip.style.left = e.clientX + 10 + 'px';
                                tooltip.style.top = e.clientY + 10 + 'px';
                                tooltip.innerHTML = `<strong>${m.name}</strong><br/>Type: ${m.type || m.media_type}<br/>Size: ${m.file_size ? (m.file_size / 1024).toFixed(0) + ' KB' : ''}`;
                                tooltip.id = 'media-tooltip';
                                document.body.appendChild(tooltip);
                              }}
                              onMouseLeave={() => {
                                const tooltip = document.getElementById('media-tooltip');
                                if (tooltip) tooltip.remove();
                              }}
                            >
                              {m.type === 'image' || m.media_type === 'image' ? (
                                <img src={m.file_url || '/placeholder.svg'} alt={m.name} className="h-16 w-16 object-contain rounded" />
                              ) : m.type === 'video' || m.media_type === 'video' ? (
                                <video src={m.file_url} className="h-16 w-16 object-contain rounded" />
                              ) : (
                                <div className="h-16 w-16 flex items-center justify-center text-muted-foreground">
                                  <span className="text-2xl">📄</span>
                                </div>
                              )}
                              {zoneMedia[zoneId]?.id === m.id && (
                                <div className="absolute top-1 right-1 bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">✓</div>
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Preview for selected media */}
                        {zoneMedia[zoneId] && (
                          <div className="mt-2">
                            {zoneMedia[zoneId]?.type === 'image' ? (
                              <img src={zoneMedia[zoneId]?.file_url} alt={zoneMedia[zoneId]?.name} className="h-16 rounded shadow transition-transform duration-200 hover:scale-105" />
                            ) : zoneMedia[zoneId]?.type === 'video' ? (
                              <video src={zoneMedia[zoneId]?.file_url} className="h-16 rounded shadow" controls />
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Live Preview and Full Screen Button */}
                  <div className="mt-6">
                    <Label>Live Layout Preview</Label>
                    <div className={`grid gap-2 bg-gray-100 p-4 rounded-lg border ${selectedGrid.gridClass}`} style={{ minHeight: '200px' }}>
                      {selectedGrid.zones.map(zoneId => (
                        <div
                          key={zoneId}
                          className={selectedGrid.zoneGrid ? selectedGrid.zoneGrid[zoneId] + ' border border-black flex items-center justify-center bg-white' : 'border border-black flex items-center justify-center bg-white'}
                          style={{ minHeight: 60 }}
                        >
                          {zoneMedia[zoneId] ? (
                            zoneMedia[zoneId]?.type === 'image' ? (
                              <img src={zoneMedia[zoneId]?.file_url} alt={zoneMedia[zoneId]?.name} className="max-h-32 max-w-full object-contain" />
                            ) : zoneMedia[zoneId]?.type === 'video' ? (
                              <video src={zoneMedia[zoneId]?.file_url} className="max-h-32 max-w-full object-contain" controls />
                            ) : null
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <Button className="mt-2" variant="outline" onClick={() => setShowFullScreenPreview(true)}>
                      Full Screen Preview
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex justify-between p-6 border-t">
            <div>
              <Button
                variant="outline"
                onClick={discardChanges}
                className="mr-2"
              >
                Disable Changes
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => {
                  if (isCreateDialogOpen) {
                    handleCreateLayout();
                  } else {
                    handleEditSave(editingLayout!);
                  }
                }}
                disabled={isSaving || !editingLayout?.name}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>{isCreateDialogOpen ? 'Creating...' : 'Saving...'}</span>
                  </div>
                ) : (
                  <span>{isCreateDialogOpen ? 'Create Layout' : 'Save Changes'}</span>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Media Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Layout Media</DialogTitle>
            <DialogDescription>Media content in this layout</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {viewingLayout && viewingLayout.mediaByZone && Object.keys(viewingLayout.mediaByZone).length > 0 ? (
              Object.entries(viewingLayout.mediaByZone).map(([zone, mediaArr]) =>
                mediaArr.map((media) => (
                  <div key={media.id + '-' + zone} className="relative group">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                      {media.type === 'image' || media.file_type?.startsWith('image/') ? (
                        <img
                          src={media.file_url || '/placeholder.svg'}
                          alt={media.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : media.type === 'video' || media.file_type?.startsWith('video/') ? (
                        <video
                          src={media.file_url}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          controls
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-sm text-muted-foreground">{media.name}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium truncate">{media.name}</p>
                      <p className="text-xs text-muted-foreground">{media.type || media.media_type} ({zone})</p>
                    </div>
                  </div>
                ))
              )
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No media content
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackConfirm(false)}>
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowBackConfirm(false);
                handleDialogChange(false);
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Layout</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{layoutToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Layout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Screen Preview Dialog */}
      <Dialog open={showFullScreenPreview} onOpenChange={setShowFullScreenPreview}>
        <DialogContent className="max-w-full w-screen h-screen flex flex-col items-center justify-center bg-black/90">
          <div className={`grid gap-2 bg-white p-8 rounded-lg border ${selectedGrid.gridClass}`} style={{ minHeight: '60vh', minWidth: '60vw' }}>
            {selectedGrid.zones.map(zoneId => (
              <div
                key={zoneId}
                className={selectedGrid.zoneGrid ? selectedGrid.zoneGrid[zoneId] + ' border border-black flex items-center justify-center bg-white' : 'border border-black flex items-center justify-center bg-white'}
                style={{ minHeight: 120, minWidth: 120, width: '100%', height: '100%' }}
              >
                {zoneMedia[zoneId] ? (
                  zoneMedia[zoneId]?.type === 'image' ? (
                    <img src={zoneMedia[zoneId]?.file_url} alt={zoneMedia[zoneId]?.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : zoneMedia[zoneId]?.type === 'video' ? (
                    <video src={zoneMedia[zoneId]?.file_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls />
                  ) : null
                ) : null}
              </div>
            ))}
          </div>
          <Button className="mt-6" variant="default" onClick={() => setShowFullScreenPreview(false)}>
            Close Preview
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layouts;
