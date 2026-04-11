import { useMemo } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { PermissionChecker, PermissionConfig } from '@/utils/permissions'

export function usePermissions() {
    const { profile } = useAuthStore()

    const permissions = useMemo(() => {
        return new PermissionChecker(profile)
    }, [profile])

    return permissions
}

export function useCanAccess(config: PermissionConfig, resourceOwnerId?: string) {
    const permissions = usePermissions()

    return useMemo(() => {
        return permissions.canAccess(config, resourceOwnerId)
    }, [permissions, config, resourceOwnerId])
}

export function useRoleCheck() {
    const { profile } = useAuthStore()

    return useMemo(() => ({
        isUser: profile?.role === 'user',
        isManager: profile?.role === 'manager',
        isAdmin: profile?.role === 'admin',
        hasMinimumRole: (role: 'user' | 'manager' | 'admin') => {
            if (!profile) return false
            const hierarchy = { user: 1, manager: 2, admin: 3 }
            return hierarchy[profile.role] >= hierarchy[role]
        }
    }), [profile])
}