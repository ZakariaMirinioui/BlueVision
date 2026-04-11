import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    HelpCircle,
    Play,
    RotateCcw,
    BookOpen,
    CheckCircle,
    Circle
} from 'lucide-react'
import { useTourStore, TOUR_SECTIONS } from '@/stores/useTourStore'
import { useToast } from '@/hooks/use-toast'

export function TourDropdown() {
    const location = useLocation()
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false)

    const {
        startTour,
        restartFullTour,
        restartCurrentSection,
        completedSections,
        hasCompletedInitialTour
    } = useTourStore()

    // Get current section based on route
    const getCurrentSection = () => {
        const routeToSection: Record<string, string> = {
            '/dashboard': 'dashboard',
            '/media-library': 'media',
            '/layouts': 'layouts',
            '/schedules': 'schedules',
            '/displays': 'displays'
        }
        return routeToSection[location.pathname]
    }

    const currentSectionId = getCurrentSection()
    const currentSectionData = currentSectionId ? TOUR_SECTIONS[currentSectionId] : null

    const handleStartFullTour = () => {
        restartFullTour()
        setIsOpen(false)
        toast({
            title: "Tour Started",
            description: "Starting the complete tour from the beginning"
        })
    }

    const handleRestartCurrentSection = () => {
        if (currentSectionId) {
            startTour(currentSectionId)
            setIsOpen(false)
            toast({
                title: "Section Tour Started",
                description: `Starting tour for ${currentSectionData?.name}`
            })
        }
    }

    const handleStartSpecificSection = (sectionId: string) => {
        const section = TOUR_SECTIONS[sectionId]
        startTour(sectionId)
        setIsOpen(false)
        toast({
            title: "Tour Started",
            description: `Starting tour for ${section.name}`
        })
    }

    const getSectionStatus = (sectionId: string) => {
        return completedSections.includes(sectionId)
    }

    const completionPercentage = Math.round(
        (completedSections.length / Object.keys(TOUR_SECTIONS).length) * 100
    )

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-primary/10 transition-colors"
                >
                    <HelpCircle className="h-5 w-5" />
                    {!hasCompletedInitialTour && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>
                    <div className="flex items-center justify-between">
                        <span>Tour Guide</span>
                        <Badge variant="secondary" className="text-xs">
                            {completionPercentage}% Complete
                        </Badge>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Quick Actions */}
                <div className="p-2 space-y-2">
                    <DropdownMenuItem
                        onClick={handleStartFullTour}
                        className="cursor-pointer flex items-center gap-2"
                    >
                        <Play className="h-4 w-4 text-green-600" />
                        <div>
                            <div className="font-medium">Start Full Tour</div>
                            <div className="text-xs text-muted-foreground">
                                Complete walkthrough of all features
                            </div>
                        </div>
                    </DropdownMenuItem>

                    {currentSectionData && (
                        <DropdownMenuItem
                            onClick={handleRestartCurrentSection}
                            className="cursor-pointer flex items-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4 text-blue-600" />
                            <div>
                                <div className="font-medium">Restart Current Section</div>
                                <div className="text-xs text-muted-foreground">
                                    {currentSectionData.name}
                                </div>
                            </div>
                        </DropdownMenuItem>
                    )}
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuLabel className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Tour Sections
                </DropdownMenuLabel>

                {/* Individual Sections */}
                <div className="max-h-64 overflow-y-auto">
                    {Object.values(TOUR_SECTIONS).map((section) => {
                        const isCompleted = getSectionStatus(section.id)
                        const isCurrent = currentSectionId === section.id

                        return (
                            <DropdownMenuItem
                                key={section.id}
                                onClick={() => handleStartSpecificSection(section.id)}
                                className="cursor-pointer flex items-start gap-3 p-3"
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {isCompleted ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Circle className="h-4 w-4 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{section.name}</span>
                                        {isCurrent && (
                                            <Badge variant="outline" className="text-xs">
                                                Current
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {section.description}
                                    </p>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {section.steps.length} steps
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        )
                    })}
                </div>

                <DropdownMenuSeparator />

                {/* Progress Summary */}
                <div className="p-3 bg-muted/50">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                            {completedSections.length} of {Object.keys(TOUR_SECTIONS).length} sections
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}