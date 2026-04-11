import { useEffect } from 'react'
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride'
import { useTourStore, TOUR_SECTIONS } from '@/stores/useTourStore'
import { useLocation } from 'react-router-dom'

const TourGuide = () => {
    const location = useLocation()
    const {
        isActive,
        currentSection,
        currentStepIndex,
        nextStep,
        prevStep,
        skipTour,
        completeTour,
        setCurrentSection
    } = useTourStore()

    // Auto-start tour for new users on dashboard
    useEffect(() => {
        const { hasCompletedInitialTour } = useTourStore.getState()
        if (!hasCompletedInitialTour && location.pathname === '/dashboard') {
            setTimeout(() => {
                useTourStore.getState().startTour('dashboard')
            }, 1000) // Delay to ensure page is loaded
        }
    }, [location.pathname])

    // Update current section based on route
    useEffect(() => {
        const routeToSection: Record<string, string> = {
            '/dashboard': 'dashboard',
            '/media-library': 'media',
            '/layouts': 'layouts',
            '/schedules': 'schedules',
            '/displays': 'displays'
        }

        const sectionId = routeToSection[location.pathname]
        if (sectionId && isActive) {
            setCurrentSection(sectionId)
        }
    }, [location.pathname, isActive, setCurrentSection])

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, index } = data

        if (type === EVENTS.STEP_AFTER) {
            if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
                completeTour()
            } else {
                nextStep()
            }
        } else if (type === EVENTS.TARGET_NOT_FOUND) {
            // Skip step if target not found
            nextStep()
        }

        if (status === STATUS.FINISHED) {
            completeTour()
        } else if (status === STATUS.SKIPPED) {
            skipTour()
        }
    }

    if (!isActive || !currentSection) {
        return null
    }

    const currentSectionData = TOUR_SECTIONS[currentSection]
    if (!currentSectionData) {
        return null
    }

    const steps = currentSectionData.steps.map(step => ({
        target: step.target,
        content: (
            <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{step.title}</h3>
                <p className="text-gray-700 leading-relaxed">{step.content}</p>
            </div>
        ),
        placement: step.placement || 'bottom',
        disableBeacon: step.disableBeacon || false,
        spotlightClicks: step.spotlightClicks || false,
        styles: {
            options: {
                primaryColor: '#4477FF',
                textColor: '#333',
                backgroundColor: '#fff',
                overlayColor: 'rgba(0, 0, 0, 0.4)',
                arrowColor: '#fff',
                zIndex: 10000,
            },
            tooltip: {
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                fontSize: '14px',
                maxWidth: '400px',
            },
            tooltipContainer: {
                textAlign: 'left' as const,
            },
            buttonNext: {
                backgroundColor: '#4477FF',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                padding: '8px 16px',
                border: 'none',
                cursor: 'pointer',
            },
            buttonBack: {
                color: '#666',
                fontSize: '14px',
                fontWeight: '500',
                padding: '8px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
            },
            buttonSkip: {
                color: '#999',
                fontSize: '14px',
                fontWeight: '500',
                padding: '8px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
            },
            spotlight: {
                borderRadius: '4px',
            }
        }
    }))

    return (
        <Joyride
            steps={steps}
            run={isActive}
            stepIndex={currentStepIndex}
            callback={handleJoyrideCallback}
            continuous={true}
            showProgress={true}
            showSkipButton={true}
            scrollToFirstStep={true}
            scrollOffset={100}
            disableOverlayClose={true}
            locale={{
                back: 'Back',
                close: 'Close',
                last: 'Finish',
                next: 'Next',
                skip: 'Skip Tour'
            }}
        />
    )
}

export default TourGuide