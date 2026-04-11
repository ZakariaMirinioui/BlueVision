import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TourStep {
    id: string
    target: string
    title: string
    content: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    disableBeacon?: boolean
    spotlightClicks?: boolean
}

export interface TourSection {
    id: string
    name: string
    description: string
    steps: TourStep[]
}

interface TourState {
    isActive: boolean
    currentSection: string | null
    currentStepIndex: number
    completedSections: string[]
    hasCompletedInitialTour: boolean

    // Actions
    startTour: (sectionId?: string) => void
    nextStep: () => void
    prevStep: () => void
    skipTour: () => void
    completeTour: () => void
    restartFullTour: () => void
    restartCurrentSection: () => void
    markSectionCompleted: (sectionId: string) => void
    setCurrentSection: (sectionId: string) => void
    resetTourProgress: () => void
}

// Define all tour sections and their steps
export const TOUR_SECTIONS: Record<string, TourSection> = {
    dashboard: {
        id: 'dashboard',
        name: 'Dashboard Overview',
        description: 'Learn about your main dashboard and overview statistics',
        steps: [
            {
                id: 'welcome',
                target: 'body',
                title: 'Welcome to Blue Vision!',
                content: 'Welcome to your digital signage management system. This tour will guide you through the main features and help you get started.',
                placement: 'top'
            },
            {
                id: 'overview-stats',
                target: '[data-tour="overview-stats"]',
                title: 'System Overview',
                content: 'Here you can see your system statistics including displays, library size, and active content. This gives you a quick overview of your digital signage network.',
                placement: 'bottom'
            },
            {
                id: 'quick-actions',
                target: '[data-tour="quick-actions"]',
                title: 'Quick Actions',
                content: 'Use these quick action buttons to perform common tasks like creating schedules, uploading media, and managing content.',
                placement: 'top'
            },
            {
                id: 'recent-activities',
                target: '[data-tour="recent-activities"]',
                title: 'Activity Log',
                content: 'Monitor all system activities here. You can filter by action type, search by user, and track all changes made to your system.',
                placement: 'top'
            },
            {
                id: 'user-permissions',
                target: '[data-tour="user-permissions"]',
                title: 'Your Permissions',
                content: 'This section shows your current role and permissions. Different roles have different access levels to system features.',
                placement: 'top'
            }
        ]
    },
    media: {
        id: 'media',
        name: 'Media Library',
        description: 'Learn how to manage your media files and content',
        steps: [
            {
                id: 'media-intro',
                target: 'body',
                title: 'Media Library',
                content: 'The Media Library is where you manage all your digital content including images, videos, and other media files.',
                placement: 'top'
            },
            {
                id: 'upload-media',
                target: '[data-tour="upload-media"]',
                title: 'Upload Media',
                content: 'Click here to upload new media files to your library. You can upload images, videos, and other supported file types.',
                placement: 'bottom'
            },
            {
                id: 'media-grid',
                target: '[data-tour="media-grid"]',
                title: 'Media Grid',
                content: 'Browse your media files in this grid view. You can preview, edit, or delete files from here.',
                placement: 'top'
            },
            {
                id: 'media-filters',
                target: '[data-tour="media-filters"]',
                title: 'Filter and Search',
                content: 'Use these filters to find specific media files by type, date, or search by name.',
                placement: 'bottom'
            }
        ]
    },
    layouts: {
        id: 'layouts',
        name: 'Layout Designer',
        description: 'Create and manage your display layouts',
        steps: [
            {
                id: 'layouts-intro',
                target: 'body',
                title: 'Layout Designer',
                content: 'Layouts define how your content is arranged and displayed on your screens. Create custom layouts for different display types.',
                placement: 'top'
            },
            {
                id: 'create-layout',
                target: '[data-tour="create-layout"]',
                title: 'Create New Layout',
                content: 'Start creating a new layout by clicking here. You can choose from templates or create a custom layout.',
                placement: 'bottom'
            },
            {
                id: 'layout-templates',
                target: '[data-tour="layout-templates"]',
                title: 'Layout Templates',
                content: 'Choose from pre-designed templates to quickly create professional-looking layouts.',
                placement: 'top'
            }
        ]
    },
    schedules: {
        id: 'schedules',
        name: 'Schedule Management',
        description: 'Learn how to schedule content to your displays',
        steps: [
            {
                id: 'schedules-intro',
                target: 'body',
                title: 'Schedule Management',
                content: 'Schedules control when and where your content is displayed. Create campaigns to show different content at different times.',
                placement: 'top'
            },
            {
                id: 'create-schedule',
                target: '[data-tour="create-schedule"]',
                title: 'Create Schedule',
                content: 'Create new schedules to control when your content appears on displays.',
                placement: 'bottom'
            },
            {
                id: 'schedule-calendar',
                target: '[data-tour="schedule-calendar"]',
                title: 'Schedule Calendar',
                content: 'View your scheduled content in calendar format to see what content is playing when.',
                placement: 'top'
            }
        ]
    },
    displays: {
        id: 'displays',
        name: 'Display Management',
        description: 'Manage your connected displays and monitors',
        steps: [
            {
                id: 'displays-intro',
                target: 'body',
                title: 'Display Management',
                content: 'Manage all your connected displays and monitors from this section. Monitor status, configure settings, and assign content.',
                placement: 'top'
            },
            {
                id: 'add-display',
                target: '[data-tour="add-display"]',
                title: 'Add New Display',
                content: 'Connect new displays to your network by adding them here.',
                placement: 'bottom'
            },
            {
                id: 'display-status',
                target: '[data-tour="display-status"]',
                title: 'Display Status',
                content: 'Monitor the status of all your displays. See which ones are online, offline, or have errors.',
                placement: 'top'
            }
        ]
    }
}

export const useTourStore = create<TourState>()(
    persist(
        (set, get) => ({
            isActive: false,
            currentSection: null,
            currentStepIndex: 0,
            completedSections: [],
            hasCompletedInitialTour: false,

            startTour: (sectionId?: string) => {
                const targetSection = sectionId || 'dashboard'
                set({
                    isActive: true,
                    currentSection: targetSection,
                    currentStepIndex: 0
                })
            },

            nextStep: () => {
                const { currentSection, currentStepIndex } = get()
                if (!currentSection) return

                const section = TOUR_SECTIONS[currentSection]
                if (currentStepIndex < section.steps.length - 1) {
                    set({ currentStepIndex: currentStepIndex + 1 })
                } else {
                    // Section completed
                    get().markSectionCompleted(currentSection)
                    get().completeTour()
                }
            },

            prevStep: () => {
                const { currentStepIndex } = get()
                if (currentStepIndex > 0) {
                    set({ currentStepIndex: currentStepIndex - 1 })
                }
            },

            skipTour: () => {
                set({
                    isActive: false,
                    currentSection: null,
                    currentStepIndex: 0,
                    hasCompletedInitialTour: true
                })
            },

            completeTour: () => {
                const { currentSection } = get()
                if (currentSection) {
                    get().markSectionCompleted(currentSection)
                }
                set({
                    isActive: false,
                    currentSection: null,
                    currentStepIndex: 0,
                    hasCompletedInitialTour: true
                })
            },

            restartFullTour: () => {
                set({
                    isActive: true,
                    currentSection: 'dashboard',
                    currentStepIndex: 0,
                    completedSections: [],
                    hasCompletedInitialTour: false
                })
            },

            restartCurrentSection: () => {
                const { currentSection } = get()
                if (currentSection) {
                    set({
                        isActive: true,
                        currentStepIndex: 0
                    })
                }
            },

            markSectionCompleted: (sectionId: string) => {
                const { completedSections } = get()
                if (!completedSections.includes(sectionId)) {
                    set({
                        completedSections: [...completedSections, sectionId]
                    })
                }
            },

            setCurrentSection: (sectionId: string) => {
                set({
                    currentSection: sectionId,
                    currentStepIndex: 0
                })
            },

            resetTourProgress: () => {
                set({
                    isActive: false,
                    currentSection: null,
                    currentStepIndex: 0,
                    completedSections: [],
                    hasCompletedInitialTour: false
                })
            }
        }),
        {
            name: 'tour-store',
            partialize: (state) => ({
                completedSections: state.completedSections,
                hasCompletedInitialTour: state.hasCompletedInitialTour
            })
        }
    )
)