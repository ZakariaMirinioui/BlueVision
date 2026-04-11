import { useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

export default function FAQ() {
    const [searchQuery, setSearchQuery] = useState("");

    const faqs = [
        {
            category: "General",
            questions: [
                {
                    q: "What is Blue Vision?",
                    a: "Blue Vision is a comprehensive digital signage management platform that allows you to control and monitor your displays, create and schedule content, and manage your digital signage network efficiently.",
                },
                {
                    q: "How do I get started with Blue Vision?",
                    a: "To get started, first log in to your account. Then, you can add your displays, create layouts, and schedule content. Check our Documentation for detailed setup instructions.",
                },
                {
                    q: "Is there a limit to how many displays I can manage?",
                    a: "The number of displays you can manage depends on your subscription plan. Contact our support team for details about your specific plan limits.",
                },
            ],
        },
        {
            category: "Technical",
            questions: [
                {
                    q: "What are the system requirements for running displays?",
                    a: "Displays require a stable internet connection and a compatible media player. We recommend using our certified players for optimal performance.",
                },
                {
                    q: "How do I update my display software?",
                    a: "Display software updates are handled automatically through our system. You'll be notified when updates are available or have been installed.",
                },
                {
                    q: "Can I use custom content types?",
                    a: "Yes, Blue Vision supports various content types including images, videos, web pages, and custom widgets. Check our documentation for supported formats.",
                },
            ],
        },
        {
            category: "Content Management",
            questions: [
                {
                    q: "How do I create a new layout?",
                    a: "Navigate to the Layouts section, click 'Create New Layout', and use our drag-and-drop editor to design your layout. You can add regions, media, and set properties as needed.",
                },
                {
                    q: "What content formats are supported?",
                    a: "We support most common image formats (PNG, JPG, GIF), video formats (MP4, WebM), PDF documents, and web content through URLs.",
                },
                {
                    q: "How do I schedule content?",
                    a: "Use the Schedules section to create new schedules. You can set specific times, dates, and recurrence patterns for your content to play.",
                },
            ],
        },
        {
            category: "Troubleshooting",
            questions: [
                {
                    q: "What should I do if a display goes offline?",
                    a: "First, check the physical connection and power supply. Then verify the network connection. If issues persist, check the Displays section for diagnostic information.",
                },
                {
                    q: "How do I report a problem?",
                    a: "You can report problems through our Support page. Provide detailed information about the issue, including any error messages and steps to reproduce the problem.",
                },
                {
                    q: "How can I check my display's health status?",
                    a: "The Displays section provides real-time health monitoring for all your displays, including connectivity, storage, and performance metrics.",
                },
            ],
        },
    ];

    const filteredFaqs = searchQuery
        ? faqs.map((category) => ({
            ...category,
            questions: category.questions.filter(
                (q) =>
                    q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    q.a.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        })).filter((category) => category.questions.length > 0)
        : faqs;

    return (
        <div className="container max-w-3xl mx-auto py-6 space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={() => window.location.href = '/support'}
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Back to Support</span>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Frequently Asked Questions
                    </h1>
                </div>
                <p className="text-lg text-muted-foreground">
                    Find answers to common questions about Blue Vision
                </p>
            </div>      <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search FAQs..."
                    className="pl-9 rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="space-y-6">
                {filteredFaqs.map((category) => (
                    <div key={category.category}>
                        <h2 className="text-xl font-semibold mb-4">{category.category}</h2>            <Accordion type="single" collapsible className="space-y-4">
                            {category.questions.map((faq, index) => (<AccordionItem
                                key={index}
                                value={`${category.category}-${index}`}
                                className="border rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200 bg-background/50"
                            >
                                <AccordionTrigger className="text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                                    {faq.q}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground pt-4 pb-2 px-2">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                ))}
            </div>
        </div>
    );
}
