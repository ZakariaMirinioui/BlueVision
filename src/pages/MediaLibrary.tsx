import {
  Film,
  Image,
  File,
  Upload,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Grid,
  List,
  Download,
  Eye,
  Pencil,
  Trash2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Removed Select import, will use custom dropdown for advanced filter
import { useToast } from "@/hooks/use-toast";
import MediaUpload from "@/components/MediaUpload";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
// ...existing code...
import { supabase } from "@/lib/supabaseClient";
import { notifyAndLog } from '@/utils/notifyAndLog';
import ShareDialog from "@/components/ShareDialog";
import EditMediaDialog from "@/components/EditMediaDialog";
import MediaPreviewDialog from "@/components/MediaPreviewDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MediaItem } from "@/types/media";

// Replace with your actual Supabase table and column names
const MEDIA_TABLE = "media";
const MEDIA_COLUMNS = "*";

const MediaLibrary = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  // Remove typeFilter, use a single filter state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: "all",
    size: null as null | 'asc' | 'desc',
    date: null as null | 'asc' | 'desc',
    owner: null as null | string,
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareDialog, setShareDialog] = useState<{ open: boolean; url: string }>({ open: false, url: "" });
  const [editDialog, setEditDialog] = useState<{ open: boolean; media: MediaItem | null }>({ open: false, media: null });

  // Handle URL parameters for automatic dialog opening
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'upload') {
      setUploadDialogOpen(true);
      // Remove the parameter from URL after opening dialog
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; media: MediaItem | null }>({ open: false, media: null });
  const [userMap, setUserMap] = useState<Record<string, { username: string; email: string }>>({});
  const [ownerUserSlide, setOwnerUserSlide] = useState(false);
  // Fetch all users for mapping user_id to username/email
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('auth_uid, username');
      if (!error && data) {
        const map: Record<string, { username: string }> = {};
        data.forEach((u: { auth_uid: string; username: string }) => {
          if (u.auth_uid) map[u.auth_uid] = { username: u.username };
        });
        setUserMap(map);
      }
    };
    fetchUsers();
  }, []);

  // Fetch media from Supabase
  const { data: mediaItems = [], refetch } = useQuery({
    queryKey: ["media-library"],
    queryFn: async () => {
      const { data, error } = await supabase.from(MEDIA_TABLE).select(MEDIA_COLUMNS);
      if (error) throw error;
      return data || [];
    },
  });

  const handleUpload = () => {
    setUploadDialogOpen(true);
  };

  const handleMediaAdded = async () => {
    setUploadDialogOpen(false);
    await refetch();
    toast({ title: "Media uploaded!", description: "Your media has been added to the library." });
  };

  const handlePreview = (mediaId: string) => {
    const media = mediaItems.find((m: MediaItem) => m.id === mediaId);
    setPreviewDialog({ open: true, media: media || null });
  };

  const getFileIcon = (type?: string, fileType?: string) => {
    switch (type) {
      case "image":
        return <Image className="h-6 w-6 text-blue-500" />;
      case "video":
        return <Film className="h-6 w-6 text-purple-500" />;
      case "document":
        return <File className="h-6 w-6 text-orange-500" />;
      default:
        return <File className="h-6 w-6" />;
    }
  };

  const handleDownload = async (item: MediaItem) => {
    if (!item.file_url) return;
    try {
      const response = await fetch(item.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({ variant: "destructive", title: "Download failed", description: "Could not download file." });
    }
  };

  const handleShare = (item: MediaItem) => {
    if (!item.file_url) return;
    setShareDialog({ open: true, url: item.file_url });
  };

  const handleEdit = (item: MediaItem) => {
    setEditDialog({ open: true, media: item });
  };

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm(`Are you sure you want to delete '${item.name}'?`)) return;
    const { error } = await supabase.from(MEDIA_TABLE).delete().eq("id", item.id);
    if (error) {
      toast({ variant: "destructive", title: "Delete failed", description: error.message });
    } else {
      toast({ title: "Media deleted" });
      await refetch();
      // Log activity for media deletion
      let userId = null;
      try {
        const stored = localStorage.getItem('user') || localStorage.getItem('xibo_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          userId = parsed.id || parsed.auth_uid || null;
        }
      } catch { }
      // Lookup username from Supabase
      let username = '';
      try {
        const { data, error } = await supabase.from('users').select('username').eq('auth_uid', userId).single();
        if (!error && data && data.username) username = data.username;
      } catch { }
      await notifyAndLog({
        title: 'Media Deleted',
        message: `Media "${item.name}" was deleted by ${username || 'Unknown User'}`,
        type: 'error',
        action_type: 'delete',
        entity: 'media',
        entity_id: item.id,
        user_id: userId,
        meta: { media: item }
      });
    }
  };

  // Filter media items based on search query and filters
  // Filter and sort media items based on search query and filters
  let filteredMedia = mediaItems.filter((item) => {
    // Remove extension for display
    const displayName = item.name.replace(/\.[^/.]+$/, "");
    const ext = item.name.includes('.') ? item.name.substring(item.name.lastIndexOf('.') + 1).toLowerCase() : '';
    const search = searchQuery.trim().toLowerCase();
    // Username lookup
    const username = item.user_id && userMap[item.user_id] ? userMap[item.user_id].username.toLowerCase() : '';
    // Search by name, id, extension, or username
    const matchesSearch =
      displayName.toLowerCase().includes(search) ||
      (item.id + "").toLowerCase().includes(search) ||
      (search.startsWith('.') ? ext === search.replace('.', '') : ext === search) ||
      username.includes(search);

    // Type filter
    let matchesType = false;
    if (filters.type === "all") matchesType = true;
    else if (filters.type === "image") matchesType = item.type === "image" || item.media_type === "image";
    else if (filters.type === "video") matchesType = item.type === "video" || item.media_type === "video";
    else if (filters.type === "document") matchesType = item.type === "document" || item.media_type === "document";
    else if (filters.type === "other") matchesType = !["image", "video", "document"].includes(item.type) && !["image", "video", "document"].includes(item.media_type);

    // Owner filter
    let matchesOwner = true;
    if (filters.owner) matchesOwner = item.user_id === filters.owner;

    return matchesSearch && matchesType && matchesOwner;
  });

  // Size/date/owner sorting
  filteredMedia = filteredMedia.sort((a, b) => {
    if (filters.size) {
      if (filters.size === 'asc') return (a.file_size || 0) - (b.file_size || 0);
      if (filters.size === 'desc') return (b.file_size || 0) - (a.file_size || 0);
    }
    if (filters.date) {
      if (filters.date === 'asc') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      if (filters.date === 'desc') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
    if (filters.ownerMode === 'az') {
      const aName = a.user_id && userMap[a.user_id] ? userMap[a.user_id].username.toLowerCase() : '';
      const bName = b.user_id && userMap[b.user_id] ? userMap[b.user_id].username.toLowerCase() : '';
      return aName.localeCompare(bName);
    }
    if (filters.ownerMode === 'za') {
      const aName = a.user_id && userMap[a.user_id] ? userMap[a.user_id].username.toLowerCase() : '';
      const bName = b.user_id && userMap[b.userId] ? userMap[b.userId].username.toLowerCase() : '';
      return bName.localeCompare(aName);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <ShareDialog open={shareDialog.open} onOpenChange={open => setShareDialog(s => ({ ...s, open }))} url={shareDialog.url} />
      <EditMediaDialog open={editDialog.open} onOpenChange={open => setEditDialog(s => ({ ...s, open }))} media={editDialog.media} onMediaUpdated={refetch} />
      <MediaPreviewDialog open={previewDialog.open} onOpenChange={open => setPreviewDialog(s => ({ ...s, open }))} media={previewDialog.media} />
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          <MediaUpload onMediaAdded={handleMediaAdded} />
        </DialogContent>
      </Dialog>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <Film className="mr-2 h-8 w-8" /> Media Library
          </h2>
          <p className="text-muted-foreground">
            Manage your media assets for digital signage content.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Unified Filter Dropdown */}
          <div className="relative" data-tour="media-filters">
            <Button variant="outline" onClick={() => setFilterDialogOpen((v) => !v)}>
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            {filterDialogOpen && (
              <>
                {/* Backdrop for click-outside */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setFilterDialogOpen(false)}
                />
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border rounded-lg shadow-lg min-w-[260px] flex">
                  {/* Main filter sections */}
                  <div className="flex flex-col min-w-[120px] divide-y divide-muted-foreground/10">
                    {[
                      { key: 'type', label: 'Type' },
                      { key: 'size', label: 'Size' },
                      { key: 'date', label: 'Date' },
                      { key: 'owner', label: 'Owner' },
                    ].map(section => (
                      <div
                        key={section.key}
                        className={`px-4 py-2 cursor-pointer flex items-center justify-between hover:bg-muted-foreground/10 transition-colors ${activeFilterSection === section.key ? 'bg-muted-foreground/5' : ''}`}
                        onMouseEnter={() => setActiveFilterSection(section.key)}
                        onClick={() => setActiveFilterSection(section.key)}
                      >
                        <span>{section.label}</span>
                        <span className={`ml-2 transition-transform ${activeFilterSection === section.key ? 'translate-x-1' : ''}`}>{/* theme-aware arrow */}
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Expanding options for active section */}
                  <div
                    className={`min-w-[180px] p-3 transition-all duration-300 ease-in-out transform ${activeFilterSection ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
                    style={{ willChange: 'transform, opacity' }}
                  >
                    {activeFilterSection === 'type' && (
                      <div className="flex flex-col gap-2">
                        <div className="font-semibold mb-1">Type</div>
                        {['all', 'image', 'video', 'document', 'other'].map(type => (
                          <Button
                            key={type}
                            variant={filters.type === type ? 'default' : 'ghost'}
                            size="sm"
                            className="justify-start"
                            onClick={() => setFilters(f => ({ ...f, type }))}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Button>
                        ))}
                      </div>
                    )}
                    {activeFilterSection === 'size' && (
                      <div className="flex flex-col gap-2">
                        <div className="font-semibold mb-1">Size</div>
                        <Button variant={filters.size === 'asc' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilters(f => ({ ...f, size: 'asc' }))}>Smallest First</Button>
                        <Button variant={filters.size === 'desc' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilters(f => ({ ...f, size: 'desc' }))}>Largest First</Button>
                        <Button variant={!filters.size ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilters(f => ({ ...f, size: null }))}>None</Button>
                      </div>
                    )}
                    {activeFilterSection === 'date' && (
                      <div className="flex flex-col gap-2">
                        <div className="font-semibold mb-1">Date</div>
                        <Button variant={filters.date === 'asc' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilters(f => ({ ...f, date: 'asc' }))}>Oldest First</Button>
                        <Button variant={filters.date === 'desc' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilters(f => ({ ...f, date: 'desc' }))}>Newest First</Button>
                        <Button variant={!filters.date ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilters(f => ({ ...f, date: null }))}>None</Button>
                      </div>
                    )}
                    {activeFilterSection === 'owner' && (
                      <div className="flex flex-col gap-2">
                        <div className="font-semibold mb-1">Owner</div>
                        <Button
                          variant={filters.ownerMode === null ? 'default' : 'ghost'}
                          size="sm"
                          className="justify-start"
                          onClick={() => { setFilters(f => ({ ...f, ownerMode: null, owner: null })); setOwnerUserSlide(false); }}
                        >None</Button>
                        <Button
                          variant={filters.ownerMode === 'az' ? 'default' : 'ghost'}
                          size="sm"
                          className="justify-start"
                          onClick={() => { setFilters(f => ({ ...f, ownerMode: 'az', owner: null })); setOwnerUserSlide(false); }}
                        >A → Z</Button>
                        <Button
                          variant={filters.ownerMode === 'za' ? 'default' : 'ghost'}
                          size="sm"
                          className="justify-start"
                          onClick={() => { setFilters(f => ({ ...f, ownerMode: 'za', owner: null })); setOwnerUserSlide(false); }}
                        >Z → A</Button>
                        <Button
                          variant={filters.ownerMode === 'by' ? 'default' : 'ghost'}
                          size="sm"
                          className="justify-start"
                          onClick={() => { setFilters(f => ({ ...f, ownerMode: 'by' })); setOwnerUserSlide(true); }}
                        >By Owner
                          <span className="ml-2">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                  {/* Owner list panel, now absolutely positioned and stuck to the right of the filter dialog */}
                  {ownerUserSlide && filters.ownerMode === 'by' && (
                    <>
                      {/* Backdrop for click-outside */}
                      <div
                        className="fixed inset-0 z-[99] bg-transparent"
                        onClick={() => { setOwnerUserSlide(false); setFilters(f => ({ ...f, ownerMode: null })); }}
                      />
                      <div
                        className="absolute top-0 right-full mr-2 bg-white dark:bg-[#18181b] border rounded-lg shadow-lg p-4 z-[100] flex flex-col"
                        style={{ minWidth: '220px', maxWidth: '320px', maxHeight: 'calc(100vh - 64px)' }}
                      >
                        <div className="font-semibold mb-3 text-lg">Select Owner</div>
                        <Button variant={!filters.owner ? 'default' : 'ghost'} size="sm" className="justify-start mb-2" onClick={() => setFilters(f => ({ ...f, owner: null }))}>All</Button>
                        <div className="flex flex-col gap-2" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                          {Object.entries(userMap)
                            .sort((a, b) => a[1].username.localeCompare(b[1].username))
                            .map(([uid, u]) => (
                              <Button
                                key={uid}
                                variant={filters.owner === uid ? 'default' : 'ghost'}
                                size="sm"
                                className="justify-start"
                                onClick={() => setFilters(f => ({ ...f, owner: uid }))}
                              >
                                {u.username}
                              </Button>
                            ))}
                        </div>
                        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => { setOwnerUserSlide(false); setFilters(f => ({ ...f, ownerMode: null })); }}>✕</Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          <Button onClick={handleUpload} data-tour="upload-media">
            <Upload className="mr-2 h-4 w-4" />
            Upload Media
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Assets</CardTitle>
          <CardDescription>
            Browse and manage your media library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
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
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media by name, type, or user"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {/* Media Content */}
          {filteredMedia.length === 0 ? (
            <div className="flex items-center justify-center h-60 bg-transparent rounded-lg text-lg text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
              Content filtered by {filters.type === "all" ? "media" : filters.type + " type"} would appear here
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4" data-tour="media-grid">
              {filteredMedia.map((item: MediaItem) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative group">
                    <img
                      src={item.file_url || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePreview(item.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => handleDownload(item)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute top-2 left-2">
                      {getFileIcon(item.type, item.file_type)}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="truncate pr-4">
                        <h4 className="font-medium text-sm truncate" title={item.name}>
                          {item.name.replace(/\.[^/.]+$/, "")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.file_type?.startsWith("video/") ? `${item.file_size ? (item.file_size / 1024 / 1024).toFixed(2) + ' MB' : ''}` :
                            item.file_type?.startsWith("image/") ? `${item.file_size ? (item.file_size / 1024).toFixed(0) + ' KB' : ''}` :
                              item.file_type}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handlePreview(item.id)}>
                            <Eye className="mr-2 h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(item)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(item)}>
                            <Share2 className="mr-2 h-4 w-4" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border mt-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left font-medium">Name</th>
                    <th className="py-3 px-4 text-left font-medium hidden sm:table-cell">Type</th>
                    <th className="py-3 px-4 text-left font-medium hidden md:table-cell">Size</th>
                    <th className="py-3 px-4 text-left font-medium hidden lg:table-cell">Uploaded</th>
                    <th className="py-3 px-4 text-left font-medium hidden xl:table-cell">Tags</th>
                    <th className="py-3 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedia.map((item: MediaItem) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* Mini thumbnail for images/videos */}
                          {item.file_type && item.file_type.startsWith('image/') && item.file_url ? (
                            <img src={item.file_url} alt={item.name} className="w-8 h-8 object-cover rounded border" />
                          ) : item.file_type && item.file_type.startsWith('video/') && item.file_url ? (
                            <video src={item.file_url} className="w-8 h-8 object-cover rounded border" />
                          ) : (
                            <img src={item.file_url || "/placeholder.svg"} alt={item.name} className="w-8 h-8 object-cover rounded border" />
                          )}
                          <span className="font-medium">{item.name.replace(/\.[^/.]+$/, "")}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        {/* Show type with extension */}
                        {item.media_type ? (item.media_type.charAt(0).toUpperCase() + item.media_type.slice(1)) : ''}
                        {item.name && item.name.includes('.') ? ` (${item.name.substring(item.name.lastIndexOf('.') + 1).toLowerCase()})` : ''}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">{item.file_size ? (item.file_size / 1024).toFixed(0) + ' KB' : ''}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div>
                          <div>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-semibold">Owner username : </span>
                            {item.user_id && userMap[item.user_id]
                              ? userMap[item.user_id].username || 'Unknown User'
                              : 'Unknown User'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden xl:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {/* {item.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))} */}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePreview(item.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDownload(item)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleShare(item)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(item)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaLibrary;
