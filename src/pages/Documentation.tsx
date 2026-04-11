import { BookOpen, Code, Database, Laptop, Monitor, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Documentation() {
    const documentationSections = [
        {
            title: "Getting Started",
            description: "Learn the basics of Blue Vision and get up and running quickly",
            icon: BookOpen,
            topics: [
                "System Requirements",
                "Installation Guide",
                "First-time Setup",
                "Basic Navigation",
            ],
        },
        {
            title: "Display Management",
            description: "Everything about managing your displays and screens",
            icon: Monitor,
            topics: [
                "Adding New Displays",
                "Display Configuration",
                "Display Groups",
                "Health Monitoring",
            ],
        },
        {
            title: "Layout Design",
            description: "Create and manage your digital signage layouts",
            icon: Laptop,
            topics: [
                "Layout Editor Basics",
                "Working with Regions",
                "Media Management",
                "Layout Templates",
            ],
        },
        {
            title: "Scheduling",
            description: "Learn about scheduling and content planning",
            icon: Calendar,
            topics: [
                "Creating Schedules",
                "Schedule Events",
                "Priority Management",
                "Recurring Events",
            ],
        },
        {
            title: "Technical Integration",
            description: "Technical details and API documentation",
            icon: Code,
            topics: [
                "API Reference",
                "Authentication",
                "Webhooks",
                "Custom Development",
            ],
        },
        {
            title: "Data Management",
            description: "Managing your data and content",
            icon: Database,
            topics: [
                "Content Library",
                "Data Backup",
                "Storage Management",
                "Media Optimization",
            ],
        },
    ];

    return (
        <div className="container max-w-7xl mx-auto py-6 space-y-8">                <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => window.location.href = '/support'}
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back to Support</span>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
            </div>
            <p className="text-lg text-muted-foreground">
                Comprehensive guides and documentation for Blue Vision
            </p>
        </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">        {documentationSections.map((section) => (
                <Card
                    key={section.title}
                    className="hover:shadow-lg transition-all duration-200 border-none shadow-md rounded-2xl hover:transform hover:-translate-y-1 bg-background/50 backdrop-blur-sm"
                >
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10">
                                <section.icon className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle>{section.title}</CardTitle>
                        </div>
                        <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {section.topics.map((topic) => (<li
                                key={topic}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-all hover:translate-x-1 rounded-lg px-2 py-1 hover:bg-primary/5"
                            >
                                • {topic}
                            </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ))}
            </div>
        </div>
    );
}
