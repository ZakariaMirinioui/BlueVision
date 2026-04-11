import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Edit, Plus } from 'lucide-react'
import { useRoleBasedAction } from '@/hooks/useRoleBasedAction'
import { UnauthorizedDialog } from '@/components/ui/unauthorized-dialog'
import { PERMISSIONS } from '@/utils/permissions'

interface Schedule {
    id: number
    user_id: string
    campaign: string
    // ... other schedule fields
}

interface ScheduleActionsProps {
    schedule?: Schedule
    onEdit?: (schedule: Schedule) => void
    onDelete?: (scheduleId: number) => void
    onCreate?: () => void
}

export function ScheduleActions({
    schedule,
    onEdit,
    onDelete,
    onCreate
}: ScheduleActionsProps) {
    // For creating schedules
    const createAction = useRoleBasedAction({
        config: PERMISSIONS.SCHEDULES.CREATE,
        onUnauthorized: (action) => console.log(`Unauthorized: ${action}`)
    })

    // For editing/deleting schedules (requires ownership check)
    const editAction = useRoleBasedAction({
        config: PERMISSIONS.SCHEDULES.UPDATE,
        resourceOwnerId: schedule?.user_id,
        onUnauthorized: (action) => console.log(`Unauthorized: ${action}`)
    })

    const deleteAction = useRoleBasedAction({
        config: PERMISSIONS.SCHEDULES.DELETE,
        resourceOwnerId: schedule?.user_id,
        onUnauthorized: (action) => console.log(`Unauthorized: ${action}`)
    })

    const handleCreate = createAction.executeWithPermission(() => {
        onCreate?.()
    }, 'create schedules')

    const handleEdit = editAction.executeWithPermission(() => {
        if (schedule) onEdit?.(schedule)
    }, 'edit this schedule')

    const handleDelete = deleteAction.executeWithPermission(() => {
        if (schedule) onDelete?.(schedule.id)
    }, 'delete this schedule')

    return (
        <div className="flex gap-2">
            <Button onClick={handleCreate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
            </Button>

            {schedule && (
                <>
                    <Button
                        onClick={handleEdit}
                        variant="outline"
                        size="sm"
                        disabled={!editAction.hasPermission}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>

                    <Button
                        onClick={handleDelete}
                        variant="destructive"
                        size="sm"
                        disabled={!deleteAction.hasPermission}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </>
            )}

            {/* Unauthorized dialogs */}
            <UnauthorizedDialog
                open={createAction.showUnauthorizedDialog}
                onOpenChange={createAction.setShowUnauthorizedDialog}
                message={`You don't have permission to ${createAction.unauthorizedAction}.`}
            />

            <UnauthorizedDialog
                open={editAction.showUnauthorizedDialog}
                onOpenChange={editAction.setShowUnauthorizedDialog}
                message={`You don't have permission to ${editAction.unauthorizedAction}.`}
            />

            <UnauthorizedDialog
                open={deleteAction.showUnauthorizedDialog}
                onOpenChange={deleteAction.setShowUnauthorizedDialog}
                message={`You don't have permission to ${deleteAction.unauthorizedAction}.`}
            />
        </div>
    )
}