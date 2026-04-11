import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Settings, Trash2, Shield } from 'lucide-react'
import { useAuthStore, UserRole, UserProfile } from '@/stores/useAuthStore'
import { usePermissions, useRoleCheck } from '@/hooks/usePermissions'
import { UnauthorizedDialog } from '@/components/ui/unauthorized-dialog'
import { PERMISSIONS } from '@/utils/permissions'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export default function UserManagement() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [showUnauthorizedDialog, setShowUnauthorizedDialog] = useState(false)
    const [unauthorizedAction, setUnauthorizedAction] = useState('')
    const roleCheck = useRoleCheck()
    const { profile } = useAuthStore()
    const permissions = usePermissions()

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch users",
                    variant: "destructive"
                })
                return
            }

            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = () => {
        if (!permissions.canAccess(PERMISSIONS.USERS.CREATE)) {
            setUnauthorizedAction('create user accounts')
            setShowUnauthorizedDialog(true)
            return
        }
        toast({
            title: "Create User",
            description: "Create user functionality would be implemented here"
        })
    }

    const handleEditUser = (user: UserProfile) => {
        if (!permissions.canAccess(PERMISSIONS.USERS.UPDATE)) {
            setUnauthorizedAction('edit user accounts')
            setShowUnauthorizedDialog(true)
            return
        }
        toast({
            title: "Edit User",
            description: `Edit user ${user.username} functionality would be implemented here`
        })
    }

    const handleDeleteUser = async (user: UserProfile) => {
        if (!permissions.canAccess(PERMISSIONS.USERS.DELETE)) {
            setUnauthorizedAction('delete user accounts')
            setShowUnauthorizedDialog(true)
            return
        }

        if (user.id === profile?.id) {
            toast({
                title: "Error",
                description: "You cannot delete your own account",
                variant: "destructive"
            })
            return
        }

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id)

            if (error) {
                toast({
                    title: "Error",
                    description: "Failed to delete user",
                    variant: "destructive"
                })
                return
            }

            toast({
                title: "Success",
                description: `User ${user.username} has been deleted`
            })

            fetchUsers() // Refresh the list
        } catch (error) {
            console.error('Error deleting user:', error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive"
            })
        }
    }

    const getRoleBadgeVariant = (role: UserRole) => {
        switch (role) {
            case 'admin': return 'destructive'
            case 'manager': return 'default'
            case 'user': return 'secondary'
            default: return 'outline'
        }
    }

    const getRoleIcon = (role: UserRole) => {
        return <Shield className="h-3 w-3" />
    }

    // Only show user management to managers and admins
    if (!roleCheck.hasMinimumRole('manager')) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="text-center py-12">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                        <p className="text-muted-foreground">
                            You don't have permission to view user management.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Contact your administrator if you believe this is an error.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="text-center py-12">
                        <p>Loading users...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl font-bold">User Management</CardTitle>

                        {roleCheck.isAdmin && (
                            <Button onClick={handleCreateUser}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create User
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-4">
                        {users.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No users found.</p>
                            </div>
                        ) : (
                            users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium">{user.username}</p>
                                                <Badge
                                                    variant={getRoleBadgeVariant(user.role)}
                                                    className="flex items-center gap-1"
                                                >
                                                    {getRoleIcon(user.role)}
                                                    {user.role.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                ID: {user.id} • Created: {new Date(user.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {roleCheck.isAdmin && (
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleEditUser(user)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                onClick={() => handleDeleteUser(user)}
                                                variant="destructive"
                                                size="sm"
                                                disabled={user.id === profile?.id}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Role Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Role Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <Shield className="h-3 w-3" />
                                USER
                            </Badge>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Manage own content</li>
                                <li>• Create schedules, media, layouts</li>
                                <li>• View own displays</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <Badge variant="default" className="flex items-center gap-1 w-fit">
                                <Shield className="h-3 w-3" />
                                MANAGER
                            </Badge>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• All user permissions</li>
                                <li>• Manage all content</li>
                                <li>• View all users</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <Shield className="h-3 w-3" />
                                ADMIN
                            </Badge>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• All manager permissions</li>
                                <li>• Create/edit/delete users</li>
                                <li>• Change user roles</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <UnauthorizedDialog
                open={showUnauthorizedDialog}
                onOpenChange={setShowUnauthorizedDialog}
                message={`You don't have permission to ${unauthorizedAction}.`}
                action="Only administrators can perform this action."
            />
        </div>
    )
}
