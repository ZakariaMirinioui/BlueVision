import { ReactNode } from 'react'
import { useRoleCheck } from '@/hooks/usePermissions'
import { UserRole } from '@/stores/useAuthStore'

interface RoleBasedNavigationProps {
    children: ReactNode
    allowedRoles: UserRole[]
    fallback?: ReactNode
}

export function RoleBasedNavigation({
    children,
    allowedRoles,
    fallback = null
}: RoleBasedNavigationProps) {
    const roleCheck = useRoleCheck()

    const hasAccess = allowedRoles.some(role => {
        switch (role) {
            case 'admin': return roleCheck.isAdmin
            case 'manager': return roleCheck.hasMinimumRole('manager')
            case 'user': return roleCheck.hasMinimumRole('user')
            default: return false
        }
    })

    return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Example usage in navigation menu
export function NavigationMenu() {
    return (
        <nav className="space-y-2">
            {/* Available to all authenticated users */}
            <RoleBasedNavigation allowedRoles={['user', 'manager', 'admin']}>
                <a href="/dashboard" className="nav-link">Dashboard</a>
                <a href="/schedules" className="nav-link">My Schedules</a>
                <a href="/media" className="nav-link">My Media</a>
                <a href="/layouts" className="nav-link">My Layouts</a>
                <a href="/displays" className="nav-link">My Displays</a>
            </RoleBasedNavigation>

            {/* Available to managers and admins */}
            <RoleBasedNavigation allowedRoles={['manager', 'admin']}>
                <div className="border-t pt-2">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Management</p>
                    <a href="/all-schedules" className="nav-link">All Schedules</a>
                    <a href="/all-media" className="nav-link">All Media</a>
                    <a href="/all-layouts" className="nav-link">All Layouts</a>
                    <a href="/all-displays" className="nav-link">All Displays</a>
                </div>
            </RoleBasedNavigation>

            {/* Available to admins only */}
            <RoleBasedNavigation allowedRoles={['admin']}>
                <div className="border-t pt-2">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Administration</p>
                    <a href="/users" className="nav-link">User Management</a>
                    <a href="/system-settings" className="nav-link">System Settings</a>
                </div>
            </RoleBasedNavigation>
        </nav>
    )
}