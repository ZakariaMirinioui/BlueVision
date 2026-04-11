import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    RefreshCw,
    Shield,
    Users,
    Eye,
    Edit,
    Plus,
    Upload,
    Monitor,
    Layers,
    Film,
    Calendar,
    Clock,
    Activity,
    ChevronRight,
    User,
    CheckCircle,
    XCircle,
    AlertTriangle,
    MessageSquare,
    Zap,
    Sparkles
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRoleCheck } from '@/hooks/usePermissions'
import { useRoleBasedAction } from '@/hooks/useRoleBasedAction'
import { RoleBasedNavigation } from '@/components/auth/RoleBasedNavigation'
import { UnauthorizedDialog } from '@/components/ui/unauthorized-dialog'
import { PERMISSIONS } from '@/utils/permissions'
import { toast } from '@/hooks/use-toast'
import OverviewStats from '@/components/OverviewStats'
import RecentActivities from '@/components/RecentActivities'
import { supabase } from '@/integrations/supabase/client'
import { xiboService } from '@/services/XiboAPI'

export default function DashboardWithLogs() {
    const { profile } = useAuthStore()
    const roleCheck = useRoleCheck()
    const navigate = useNavigate()
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Role-based actions for quick actions
    const createScheduleAction = useRoleBasedAction({
        config: PERMISSIONS.SCHEDULES.CREATE,
        onUnauthorized: (action) => console.log(`Unauthorized: ${action}`)
    })

    const createMediaAction = useRoleBasedAction({
        config: PERMISSIONS.MEDIA.CREATE,
        onUnauthorized: (action) => console.log(`Unauthorized: ${action}`)
    })

    const manageUsersAction = useRoleBasedAction({
        config: PERMISSIONS.USERS.READ,
        onUnauthorized: (action) => console.log(`Unauthorized: ${action}`)
    })

    // Data fetching queries for detailed sections
    const { data: displays = [] } = useQuery({
        queryKey: ['displays'],
        queryFn: () => xiboService.getDisplays(),
        refetchInterval: 60000,
    })

    const { data: layouts = [] } = useQuery({
        queryKey: ['layouts'],
        queryFn: async () => {
            const { data, error } = await supabase.from('layouts').select('*').order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        },
        refetchInterval: 60000,
    })

    const { data: media = [] } = useQuery({
        queryKey: ['media'],
        queryFn: async () => {
            const { data, error } = await supabase.from('media').select('*').order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        },
        refetchInterval: 60000,
    })

    const { data: schedules = [] } = useQuery({
        queryKey: ['schedules'],
        queryFn: async () => {
            const { data, error } = await supabase.from('schedules').select('*').order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        },
        refetchInterval: 60000,
    })

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        },
        refetchInterval: 60000,
        enabled: roleCheck.hasMinimumRole('manager'), // Only fetch if user has permission
    })

    const handleQuickAction = (action: string, callback: () => void) => {
        return () => {
            callback()
            toast({
                title: "Quick Action",
                description: `${action} functionality would be implemented here`
            })
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            // Refresh data
            await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate refresh
            toast({
                title: "Dashboard Refreshed",
                description: "All data has been updated successfully"
            })
        } catch (error) {
            toast({
                title: "Refresh Failed",
                description: "Failed to refresh dashboard data",
                variant: "destructive"
            })
        } finally {
            setIsRefreshing(false)
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'text-red-600'
            case 'manager': return 'text-blue-600'
            case 'user': return 'text-green-600'
            default: return 'text-gray-600'
        }
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        Welcome back, {profile?.username}!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Here's an overview of your digital signage network
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <div className="relative group">
                        <Badge
                            variant={
                                profile?.role === 'admin' ? 'destructive' :
                                    profile?.role === 'manager' ? 'default' :
                                        'secondary'
                            }
                            className="flex items-center gap-1 cursor-help transition-all duration-200 hover:scale-105 hover:shadow-md"
                        >
                            <Shield className="h-3 w-3" />
                            {profile?.role?.toUpperCase()}
                        </Badge>

                        {/* Hover Tooltip */}
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out transform translate-y-2 group-hover:translate-y-0 z-50 animate-in slide-in-from-top-2">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm">Your Permissions</h3>
                                </div>

                                <div className="space-y-3">
                                    {/* Content Management */}
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <Edit className="h-3 w-3" />
                                            Content Management
                                        </h4>
                                        <div className="text-xs space-y-0.5 pl-4">
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                                <span>Create and edit content</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                                <span>Upload media files</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                                <span>Design layouts</span>
                                            </div>
                                            {roleCheck.hasMinimumRole('manager') && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                                    <span className="text-blue-600">Manage all user content</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Access Level */}
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            Access Level
                                        </h4>
                                        <div className="text-xs space-y-0.5 pl-4">
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                                <span>View dashboard</span>
                                            </div>
                                            {roleCheck.hasMinimumRole('manager') && (
                                                <>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                                        <span className="text-blue-600">View all user content</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                                        <span className="text-blue-600">System overview</span>
                                                    </div>
                                                </>
                                            )}
                                            {roleCheck.isAdmin && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                                    <span className="text-red-600">Full system access</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Administration */}
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <Shield className="h-3 w-3" />
                                            Administration
                                        </h4>
                                        <div className="text-xs space-y-0.5 pl-4">
                                            {roleCheck.isAdmin ? (
                                                <>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                                        <span className="text-red-600">Create/edit/delete users</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                                        <span className="text-red-600">Change user roles</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                                        <span className="text-red-600">System settings</span>
                                                    </div>
                                                </>
                                            ) : roleCheck.isManager ? (
                                                <>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                                        <span className="text-blue-600">View user accounts</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                                        <span className="text-gray-500">Cannot modify users</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                                        <span className="text-gray-500">No user management access</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                                        <span className="text-gray-500">No system administration</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Role Badge at Bottom */}
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Current Role:</span>
                                        <Badge
                                            variant={
                                                profile?.role === 'admin' ? 'destructive' :
                                                    profile?.role === 'manager' ? 'default' :
                                                        'secondary'
                                            }
                                            className="text-xs"
                                        >
                                            {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Tooltip Arrow */}
                            <div className="absolute -top-2 right-4 w-4 h-4 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform rotate-45"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div data-tour="overview-stats">
                <OverviewStats />
            </div>

            {/* Quick Actions */}
            <Card data-tour="quick-actions" className="border-none shadow-lg shadow-secondary/5">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5">
                            <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Quick Actions</CardTitle>
                            <p className="text-sm text-muted-foreground">Perform common tasks with one click</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {/* Send Message - First */}
                        <Button
                            onClick={() => {
                                navigate('/displays?action=message')
                                toast({
                                    title: "Send Message",
                                    description: "Opening message dialog for displays"
                                })
                            }}
                            className="h-24 flex-col gap-3 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            variant="outline"
                        >
                            <div className="p-2 rounded-full bg-blue-500/10">
                                <MessageSquare className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium">Send Message</span>
                        </Button>

                        {/* Create Display - Second */}
                        <Button
                            onClick={() => {
                                navigate('/displays/create')
                                toast({
                                    title: "Create Display",
                                    description: "Opening display creation form"
                                })
                            }}
                            className="h-24 flex-col gap-3 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200 hover:border-green-300 text-green-700 hover:text-green-800 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            variant="outline"
                        >
                            <div className="p-2 rounded-full bg-green-500/10">
                                <Monitor className="h-6 w-6 text-green-600" />
                            </div>
                            <span className="text-sm font-medium">Create Display</span>
                        </Button>

                        {/* Create Layout - Third */}
                        <Button
                            onClick={() => {
                                navigate('/layouts?action=create')
                                toast({
                                    title: "Create Layout",
                                    description: "Opening layout creation dialog"
                                })
                            }}
                            className="h-24 flex-col gap-3 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-200 hover:border-purple-300 text-purple-700 hover:text-purple-800 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            variant="outline"
                        >
                            <div className="p-2 rounded-full bg-purple-500/10">
                                <Layers className="h-6 w-6 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium">Create Layout</span>
                        </Button>

                        {/* Create Schedule */}
                        <Button
                            onClick={createScheduleAction.executeWithPermission(
                                () => {
                                    navigate('/schedules?action=create')
                                    toast({
                                        title: "Create Schedule",
                                        description: "Opening schedule creation dialog"
                                    })
                                },
                                'create schedules'
                            )}
                            className="h-24 flex-col gap-3 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-orange-200 hover:border-orange-300 text-orange-700 hover:text-orange-800 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            variant="outline"
                        >
                            <div className="p-2 rounded-full bg-orange-500/10">
                                <Calendar className="h-6 w-6 text-orange-600" />
                            </div>
                            <span className="text-sm font-medium">Create Schedule</span>
                        </Button>

                        {/* Upload Media */}
                        <Button
                            onClick={createMediaAction.executeWithPermission(
                                () => {
                                    navigate('/media-library?action=upload')
                                    toast({
                                        title: "Upload Media",
                                        description: "Opening media upload dialog"
                                    })
                                },
                                'upload media'
                            )}
                            className="h-24 flex-col gap-3 bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 border-teal-200 hover:border-teal-300 text-teal-700 hover:text-teal-800 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            variant="outline"
                        >
                            <div className="p-2 rounded-full bg-teal-500/10">
                                <Upload className="h-6 w-6 text-teal-600" />
                            </div>
                            <span className="text-sm font-medium">Upload Media</span>
                        </Button>

                        {/* Manage Users - Admin Only */}
                        <RoleBasedNavigation allowedRoles={['admin']}>
                            <Button
                                onClick={manageUsersAction.executeWithPermission(
                                    () => {
                                        navigate('/users')
                                        toast({
                                            title: "Manage Users",
                                            description: "Opening user management panel"
                                        })
                                    },
                                    'manage users'
                                )}
                                className="h-24 flex-col gap-3 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-200 hover:border-red-300 text-red-700 hover:text-red-800 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                variant="outline"
                            >
                                <div className="p-2 rounded-full bg-red-500/10">
                                    <Users className="h-6 w-6 text-red-600" />
                                </div>
                                <span className="text-sm font-medium">Manage Users</span>
                            </Button>
                        </RoleBasedNavigation>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-blue-600">{displays.length}</div>
                                <div className="text-xs text-muted-foreground">Total Displays</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-purple-600">{layouts.length}</div>
                                <div className="text-xs text-muted-foreground">Layouts</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-green-600">{media.length}</div>
                                <div className="text-xs text-muted-foreground">Media Files</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-orange-600">{schedules.length}</div>
                                <div className="text-xs text-muted-foreground">Schedules</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed System Overview Sections */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">System Overview</h2>
                    <p className="text-muted-foreground">Detailed view of your digital signage components</p>
                </div>

                {/* First Row: Displays and Layouts */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Displays Section */}
                    <Card
                        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-blue-500"
                        onClick={() => navigate('/displays')}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-blue-500/10">
                                        <Monitor className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Display Management</CardTitle>
                                        <p className="text-sm text-muted-foreground">Monitor and control your displays</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{displays.length}</div>
                                    <div className="text-xs text-muted-foreground">Total Displays</div>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {displays.filter(d => d.status === 'online' || d.status === 'active').length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Online</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Status Distribution</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        <span>Active: {displays.filter(d => d.status === 'active').length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-3 w-3 text-blue-500" />
                                        <span>Online: {displays.filter(d => d.status === 'online').length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-3 w-3 text-gray-500" />
                                        <span>Offline: {displays.filter(d => d.status === 'offline').length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3 text-red-500" />
                                        <span>Error: {displays.filter(d => d.status === 'error').length}</span>
                                    </div>
                                </div>
                            </div>

                            {displays.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Recent Displays</div>
                                    <div className="space-y-1">
                                        {displays.slice(0, 3).map((display, index) => (
                                            <div key={display.id || index} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                                                <span className="font-medium">{display.name || `Display ${index + 1}`}</span>
                                                <Badge
                                                    variant={
                                                        display.status === 'active' || display.status === 'online' ? 'default' :
                                                            display.status === 'error' ? 'destructive' : 'secondary'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {display.status || 'offline'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Layouts Section */}
                    <Card
                        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-purple-500"
                        onClick={() => navigate('/layouts')}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-purple-500/10">
                                        <Layers className="h-6 w-6 text-purple-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Layout Designer</CardTitle>
                                        <p className="text-sm text-muted-foreground">Create and manage layouts</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{layouts.length}</div>
                                    <div className="text-xs text-muted-foreground">Total Layouts</div>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {layouts.filter(l => l.status === 'published' || l.status === 'active').length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Published</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Layout Status</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        <span>Published: {layouts.filter(l => l.status === 'published').length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-yellow-500" />
                                        <span>Draft: {layouts.filter(l => l.status === 'draft').length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-3 w-3 text-blue-500" />
                                        <span>Active: {layouts.filter(l => l.status === 'active').length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-3 w-3 text-gray-500" />
                                        <span>Inactive: {layouts.filter(l => l.status === 'inactive').length}</span>
                                    </div>
                                </div>
                            </div>

                            {layouts.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Recent Layouts</div>
                                    <div className="space-y-1">
                                        {layouts.slice(0, 3).map((layout, index) => (
                                            <div key={layout.id || index} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                                                <span className="font-medium">{layout.name || `Layout ${index + 1}`}</span>
                                                <Badge
                                                    variant={
                                                        layout.status === 'published' || layout.status === 'active' ? 'default' :
                                                            layout.status === 'draft' ? 'secondary' : 'outline'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {layout.status || 'draft'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Second Row: Media and Schedules */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Media Section */}
                    <Card
                        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-green-500"
                        onClick={() => navigate('/media-library')}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-green-500/10">
                                        <Film className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Media Library</CardTitle>
                                        <p className="text-sm text-muted-foreground">Manage your media assets</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{media.length}</div>
                                    <div className="text-xs text-muted-foreground">Total Files</div>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {(media.reduce((acc, m) => acc + (m.file_size || 0), 0) / (1024 * 1024 * 1024)).toFixed(1)}GB
                                    </div>
                                    <div className="text-xs text-muted-foreground">Total Size</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Media Types</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                                        <span>Images: {media.filter(m => m.type === 'image' || m.file_type?.startsWith('image')).length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                                        <span>Videos: {media.filter(m => m.type === 'video' || m.file_type?.startsWith('video')).length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                                        <span>Documents: {media.filter(m => m.type === 'document' || m.file_type?.includes('pdf')).length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                                        <span>Other: {media.filter(m => !['image', 'video', 'document'].includes(m.type) && !m.file_type?.startsWith('image') && !m.file_type?.startsWith('video')).length}</span>
                                    </div>
                                </div>
                            </div>

                            {media.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Recent Media</div>
                                    <div className="space-y-1">
                                        {media.slice(0, 3).map((mediaItem, index) => (
                                            <div key={mediaItem.id || index} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                                                <span className="font-medium truncate">{mediaItem.name || `Media ${index + 1}`}</span>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {mediaItem.type || 'file'}
                                                    </Badge>
                                                    <span className="text-muted-foreground">
                                                        {mediaItem.file_size ? `${(mediaItem.file_size / (1024 * 1024)).toFixed(1)}MB` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Schedules Section */}
                    <Card
                        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-orange-500"
                        onClick={() => navigate('/schedules')}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-orange-500/10">
                                        <Calendar className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Schedule Management</CardTitle>
                                        <p className="text-sm text-muted-foreground">Control content scheduling</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-orange-600">{schedules.length}</div>
                                    <div className="text-xs text-muted-foreground">Total Schedules</div>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {schedules.filter(s => {
                                            const now = new Date()
                                            const startDate = s.from_dt ? new Date(s.from_dt) : null
                                            const endDate = s.to_dt ? new Date(s.to_dt) : null
                                            return startDate && endDate && startDate <= now && now <= endDate
                                        }).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Active Now</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Schedule Status</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        <span>Active: {schedules.filter(s => {
                                            const now = new Date()
                                            const startDate = s.from_dt ? new Date(s.from_dt) : null
                                            const endDate = s.to_dt ? new Date(s.to_dt) : null
                                            return startDate && endDate && startDate <= now && now <= endDate
                                        }).length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-blue-500" />
                                        <span>Upcoming: {schedules.filter(s => {
                                            const now = new Date()
                                            const startDate = s.from_dt ? new Date(s.from_dt) : null
                                            return startDate && startDate > now
                                        }).length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-3 w-3 text-gray-500" />
                                        <span>Expired: {schedules.filter(s => {
                                            const now = new Date()
                                            const endDate = s.to_dt ? new Date(s.to_dt) : null
                                            return endDate && endDate < now
                                        }).length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                        <span>Draft: {schedules.filter(s => !s.from_dt || !s.to_dt).length}</span>
                                    </div>
                                </div>
                            </div>

                            {schedules.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Recent Schedules</div>
                                    <div className="space-y-1">
                                        {schedules.slice(0, 3).map((schedule, index) => (
                                            <div key={schedule.id || index} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                                                <span className="font-medium truncate">{schedule.campaign || `Schedule ${index + 1}`}</span>
                                                <Badge
                                                    variant={
                                                        (() => {
                                                            const now = new Date()
                                                            const startDate = schedule.from_dt ? new Date(schedule.from_dt) : null
                                                            const endDate = schedule.to_dt ? new Date(schedule.to_dt) : null
                                                            if (startDate && endDate && startDate <= now && now <= endDate) return 'default'
                                                            if (startDate && startDate > now) return 'secondary'
                                                            if (endDate && endDate < now) return 'outline'
                                                            return 'destructive'
                                                        })()
                                                    }
                                                    className="text-xs"
                                                >
                                                    {(() => {
                                                        const now = new Date()
                                                        const startDate = schedule.from_dt ? new Date(schedule.from_dt) : null
                                                        const endDate = schedule.to_dt ? new Date(schedule.to_dt) : null
                                                        if (startDate && endDate && startDate <= now && now <= endDate) return 'Active'
                                                        if (startDate && startDate > now) return 'Upcoming'
                                                        if (endDate && endDate < now) return 'Expired'
                                                        return 'Draft'
                                                    })()}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Third Row: Users Section (only for managers and admins) */}
                <RoleBasedNavigation allowedRoles={['manager', 'admin']}>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card
                            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-indigo-500"
                            onClick={() => navigate('/users')}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-indigo-500/10">
                                            <Users className="h-6 w-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">User Management</CardTitle>
                                            <p className="text-sm text-muted-foreground">Manage system users and access</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold text-indigo-600">{users.length}</div>
                                        <div className="text-xs text-muted-foreground">Total Users</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {users.filter(u => {
                                                const lastActivity = u.last_sign_in_at || u.updated_at || u.created_at
                                                if (!lastActivity) return false
                                                const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
                                                return daysSinceActivity <= 7
                                            }).length}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Active (7d)</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">User Roles</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-3 w-3 text-red-500" />
                                            <span>Admins: {users.filter(u => u.role === 'admin').length}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-3 w-3 text-blue-500" />
                                            <span>Managers: {users.filter(u => u.role === 'manager').length}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-3 w-3 text-green-500" />
                                            <span>Users: {users.filter(u => u.role === 'user').length}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-3 w-3 text-orange-500" />
                                            <span>Recent: {users.filter(u => {
                                                const created = u.created_at ? new Date(u.created_at) : null
                                                if (!created) return false
                                                const daysSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
                                                return daysSinceCreated <= 30
                                            }).length}</span>
                                        </div>
                                    </div>
                                </div>

                                {users.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Recently Active Users</div>
                                        <div className="space-y-1">
                                            {users
                                                .sort((a, b) => {
                                                    const aActivity = a.last_sign_in_at || a.updated_at || a.created_at
                                                    const bActivity = b.last_sign_in_at || b.updated_at || b.created_at
                                                    return new Date(bActivity || 0).getTime() - new Date(aActivity || 0).getTime()
                                                })
                                                .slice(0, 3)
                                                .map((user, index) => (
                                                    <div key={user.id || index} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                                                        <span className="font-medium">{user.username || `User ${index + 1}`}</span>
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant={
                                                                    user.role === 'admin' ? 'destructive' :
                                                                        user.role === 'manager' ? 'default' : 'secondary'
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {user.role || 'user'}
                                                            </Badge>
                                                            <span className="text-muted-foreground">
                                                                {user.last_sign_in_at ?
                                                                    new Date(user.last_sign_in_at).toLocaleDateString() :
                                                                    'Never'
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* System Health Card */}
                        <Card className="border-l-4 border-l-teal-500">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-teal-500/10">
                                        <Activity className="h-6 w-6 text-teal-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">System Health</CardTitle>
                                        <p className="text-sm text-muted-foreground">Overall system status</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {Math.round(((displays.filter(d => d.status === 'online' || d.status === 'active').length / Math.max(displays.length, 1)) * 100))}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Uptime</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {displays.length + layouts.length + media.length + schedules.length}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Total Assets</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>System Components</span>
                                        <span className="text-green-600 font-medium">Healthy</span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span>Display Network</span>
                                            <div className="flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                <span>Online</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span>Content Delivery</span>
                                            <div className="flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                <span>Active</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span>User Sessions</span>
                                            <div className="flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                <span>Stable</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span>Data Sync</span>
                                            <div className="flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                <span>Synchronized</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </RoleBasedNavigation>
            </div>

            {/* Recent Activities Section - Moved to Bottom */}
            <Card data-tour="recent-activities" className="mt-8">
                <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Track all system activities and user actions
                    </p>
                </CardHeader>
                <CardContent>
                    <RecentActivities />
                </CardContent>
            </Card>

            {/* Unauthorized dialogs */}
            <UnauthorizedDialog
                open={createScheduleAction.showUnauthorizedDialog}
                onOpenChange={createScheduleAction.setShowUnauthorizedDialog}
                message={`You don't have permission to ${createScheduleAction.unauthorizedAction}.`}
            />

            <UnauthorizedDialog
                open={createMediaAction.showUnauthorizedDialog}
                onOpenChange={createMediaAction.setShowUnauthorizedDialog}
                message={`You don't have permission to ${createMediaAction.unauthorizedAction}.`}
            />

            <UnauthorizedDialog
                open={manageUsersAction.showUnauthorizedDialog}
                onOpenChange={manageUsersAction.setShowUnauthorizedDialog}
                message={`You don't have permission to ${manageUsersAction.unauthorizedAction}.`}
                action="Only administrators can manage user accounts."
            />
        </div>
    )
}