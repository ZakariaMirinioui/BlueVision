import { UserRole, UserProfile } from '@/stores/useAuthStore'

export interface PermissionConfig {
    allowedRoles: UserRole[]
    requireOwnership?: boolean
    ownershipField?: string
}

export class PermissionChecker {
    constructor(private userProfile: UserProfile | null) { }

    hasRole(role: UserRole): boolean {
        return this.userProfile?.role === role
    }

    hasMinimumRole(minimumRole: UserRole): boolean {
        if (!this.userProfile) return false

        const roleHierarchy: Record<UserRole, number> = {
            user: 1,
            manager: 2,
            admin: 3
        }

        return roleHierarchy[this.userProfile.role] >= roleHierarchy[minimumRole]
    }

    canAccess(config: PermissionConfig, resourceOwnerId?: string): boolean {
        if (!this.userProfile) return false;

        const { allowedRoles, requireOwnership } = config;

        if (!allowedRoles.includes(this.userProfile.role)) {
            return false;
        }

        if (requireOwnership) {
            if (this.hasMinimumRole('manager')) {
                return true;
            }
            return resourceOwnerId === this.userProfile.id.toString();
        }

        return true;
    }

    canManageUsers(): boolean {
        return this.hasRole('admin')
    }

    canManageAllContent(): boolean {
        return this.hasMinimumRole('manager')
    }

    canCreateContent(): boolean {
        return this.hasMinimumRole('user')
    }

    canEditContent(ownerId?: string): boolean {
        if (!this.userProfile) return false

        // Managers and admins can edit all content
        if (this.hasMinimumRole('manager')) return true

        // Users can only edit their own content
        return ownerId === this.userProfile.id.toString()
    }

    canDeleteContent(ownerId?: string): boolean {
        return this.canEditContent(ownerId)
    }

    canViewContent(ownerId?: string): boolean {
        if (!this.userProfile) return false

        // Managers and admins can view all content
        if (this.hasMinimumRole('manager')) return true

        // Users can only view their own content
        return ownerId === this.userProfile.id.toString()
    }
}

// Permission configurations for different resources
export const PERMISSIONS = {
    SCHEDULES: {
        CREATE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[] },
        READ: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true },
        UPDATE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true },
        DELETE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true }
    },
    MEDIA: {
        CREATE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[] },
        READ: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true },
        UPDATE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true },
        DELETE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true }
    },
    LAYOUTS: {
        CREATE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[] },
        READ: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true },
        UPDATE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true },
        DELETE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true }
    },
    DISPLAYS: {
        CREATE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[] },
        READ: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true },
        UPDATE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true },
        DELETE: { allowedRoles: ['user', 'manager', 'admin'] as UserRole[], requireOwnership: true }
    },
    USERS: {
        CREATE: { allowedRoles: ['admin'] as UserRole[] },
        READ: { allowedRoles: ['manager', 'admin'] as UserRole[] },
        UPDATE: { allowedRoles: ['admin'] as UserRole[] },
        DELETE: { allowedRoles: ['admin'] as UserRole[] }
    }
} as const
