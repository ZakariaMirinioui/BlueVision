import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Settings, Trash2 } from 'lucide-react'
import { useRoleBasedAction } from '@/hooks/useRoleBasedAction'
import { useRoleCheck } from '@/hooks/usePermissions'
import { UnauthorizedDialog } from '@/components/ui/unauthorized-dialog'
import { PERMISSIONS } from '@/utils/permissions'
import { UserRole } from '@/stores/useAuthStore'

interface User {
    id: number
    username: string
    role: UserRole
    created_at: string
}

interface UserManagementProps {
    users: User[]
    onCreateUser?: () => void
    onEditUser?: (user: User) => void
    onDeleteUser?: (userId: number) => void
}

export function UserManagement({
    users,
    onCreateUser,
    onEditUser,
    onDeleteUser
}: UserManagementProps) {
    const roleCheck = useRoleCheck()

    const createUserAction = useRoleBasedAction({
        config: PERMISSIONS.USERS.CREATE,
        onUnauthorized: (action) => console.log(`Unauthorized: ${action}`)
    })

    const editUserAction = useRoleBasedAction({
        config: PERMISSIONS.USERS.UPDATE,
        onUnauthorized: (action) => console.log(`Unauthorized: ${action}`)
    })

    const deleteUserAction = useRoleBasedAction({
        config: PERMISSIONS.USERS.DELETE,
        onUnauthorized: (action) => console.log(`Unauthorized: ${action}`)
    })

    const handleCreateUser = createUserAction.executeWithPermission(() => {
        onCreateUser?.()
    }, 'create user accounts')

    const handleEditUser = (user: User) => {
        editUserAction.executeWithPermission(() => {
            onEditUser?.(user)
        }, 'edit user accounts')()
    }

    const handleDeleteUser = (userId: number) => {
        deleteUserAction.executeWithPermission(() => {
            onDeleteUser?.(userId)
        }, 'delete user accounts')()
    }

    const getRoleBadgeVariant = (role: UserRole) => {
        switch (role) {
            case 'admin': return 'destructive'
            case 'manager': return 'default'
            case 'user': return 'secondary'
            default: return 'outline'
        }
    }

    // Only show user management to managers and admins
    if (!roleCheck.hasMinimumRole('manager')) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">
                    You don't have permission to view user management.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">User Management</h2>

                {roleCheck.isAdmin && (
                    <Button onClick={handleCreateUser}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                    </Button>
                )}
            </div>

            <div className="grid gap-4">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                    >
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="font-medium">{user.username}</p>
                                <p className="text-sm text-muted-foreground">
                                    Created: {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                {user.role.toUpperCase()}
                            </Badge>
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
                                    onClick={() => handleDeleteUser(user.id)}
                                    variant="destructive"
                                    size="sm"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Unauthorized dialogs */}
            <UnauthorizedDialog
                open={createUserAction.showUnauthorizedDialog}
                onOpenChange={createUserAction.setShowUnauthorizedDialog}
                message={`You don't have permission to ${createUserAction.unauthorizedAction}.`}
                action="Only administrators can create user accounts."
            />

            <UnauthorizedDialog
                open={editUserAction.showUnauthorizedDialog}
                onOpenChange={editUserAction.setShowUnauthorizedDialog}
                message={`You don't have permission to ${editUserAction.unauthorizedAction}.`}
                action="Only administrators can edit user accounts."
            />

            <UnauthorizedDialog
                open={deleteUserAction.showUnauthorizedDialog}
                onOpenChange={deleteUserAction.setShowUnauthorizedDialog}
                message={`You don't have permission to ${deleteUserAction.unauthorizedAction}.`}
                action="Only administrators can delete user accounts."
            />
        </div>
    )
}