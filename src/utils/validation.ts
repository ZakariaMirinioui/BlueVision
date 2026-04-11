import { DisplayDB } from "../types/display";

export interface ValidationErrors {
    [key: string]: string;
}

export interface ValidationResult {
    errors: ValidationErrors;
    hasErrors: boolean;
}

export const validateDisplayForm = (display: Partial<DisplayDB>): ValidationResult => {
    const errors: ValidationErrors = {};
    let hasErrors = false;

    // Name validation
    if (!display.name?.trim()) {
        errors.name = "Display name is required";
        hasErrors = true;
    } else if (display.name.trim().length < 3) {
        errors.name = "Display name must be at least 3 characters";
        hasErrors = true;
    }

    // Location validation
    if (!display.location?.trim()) {
        errors.location = "Location is required";
        hasErrors = true;
    } else if (display.location.trim().length < 3) {
        errors.location = "Location must be at least 3 characters";
        hasErrors = true;
    }

    // Optional group name validation
    if (display.group_name && display.group_name.trim().length < 2) {
        errors.group_name = "Group name must be at least 2 characters";
        hasErrors = true;
    }

    return { errors, hasErrors };
};
