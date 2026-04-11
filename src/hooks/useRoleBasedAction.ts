import { useState, useCallback } from 'react';
import { usePermissions } from './usePermissions';
import { toast } from './use-toast';
import { PermissionConfig } from '@/utils/permissions';

interface RoleBasedActionConfig {
    config: PermissionConfig;
    onUnauthorized?: (action: string) => void;
}

export const useRoleBasedAction = ({ config, onUnauthorized }: RoleBasedActionConfig) => {
    const permissions = usePermissions();
    const [showUnauthorizedDialog, setShowUnauthorizedDialog] = useState(false);
    const [unauthorizedAction, setUnauthorizedAction] = useState('');

    const executeWithPermission = useCallback(
        (callback: () => void, actionName: string) => {
            return () => {
                if (permissions.canAccess(config)) {
                    callback();
                } else {
                    setUnauthorizedAction(actionName);
                    setShowUnauthorizedDialog(true);
                    if (onUnauthorized) {
                        onUnauthorized(actionName);
                    } else {
                        toast({
                            title: 'Permission Denied',
                            description: `You do not have permission to ${actionName}.`,
                            variant: 'destructive',
                        });
                    }
                }
            };
        },
        [permissions, config, onUnauthorized]
    );

    return {
        executeWithPermission,
        showUnauthorizedDialog,
        setShowUnauthorizedDialog,
        unauthorizedAction,
    }
}
