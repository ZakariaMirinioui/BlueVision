import { ReactNode, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionConfig } from '@/utils/permissions'
import { UnauthorizedDialog } from '@/components/ui/unauthorized-dialog'

interface PermissionGuardProps {
    children: ReactNode
    config: PermissionConfig
    resourceOwnerId?: string
    fallback?: ReactNode
    showDialog?: boolean
    onUnauthorized?: () => void
}

export function PermissionGuard({
    children,
    config,
    resourceOwnerId,
    fallback = null,
    showDialog = true,
    onUnauthorized
}: PermissionGuardProps) {
    const permissions = usePermissions()
    const [showUnauthorizedDialog, setShowUnauthorizedDialog] = useState(false)

    const hasPermission = permissions.canAccess(config, resourceOwnerId)

    if (!hasPermission) {
        if (onUnauthorized) {
            onUnauthorized()
        }

        if (showDialog) {
            return (
                <>
                    {fallback}
                    <UnauthorizedDialog
                        open={showUnauthorizedDialog}
                        onOpenChange={setShowUnauthorizedDialog}
                    />
                </>
            )
        }

        return <>{fallback}</>
    }

    return <>{children}</>
}

// Higher-order component version
export function withPermissionGuard<P extends object>(
    Component: React.ComponentType<P>,
    config: PermissionConfig,
    getResourceOwnerId?: (props: P) => string | undefined
) {
    return function PermissionGuardedComponent(props: P) {
        const resourceOwnerId = getResourceOwnerId?.(props)

        return (
            <PermissionGuard config={config} resourceOwnerId={resourceOwnerId}>
                <Component {...props} />
            </PermissionGuard>
        )
    }
}