import { useState } from "react";
import { Mail, HelpCircle, MessagesSquare, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SupportPage() {
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Create email body with formatted content
        const emailBody = `Category: ${category}\nPriority: ${priority}\n\nDescription:\n${description}`;
        const encodedBody = encodeURIComponent(emailBody);
        const encodedSubject = encodeURIComponent(subject);

        // Open default email client with pre-filled content
        window.location.href = `mailto:Fouad.IBNELHAJ@brinks.com?subject=${encodedSubject}&body=${encodedBody}`;
    };

    const supportContacts = [
        {
            name: "Fouad IBNELHAJ",
            email: "Fouad.IBNELHAJ@brinks.com",
            primary: true,
        },
        {
            name: "Driss Saghrouchni",
            email: "Driss.Saghrouchni@brinks.com",
            primary: false,
        },
    ];

    return (
        <div className="container max-w-5xl mx-auto py-6 space-y-8">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Support</h1>
                <p className="text-lg text-muted-foreground">
                    Get help with Blue Vision. Our support team is here to assist you.
                </p>
            </div>

            <Card className="border-none shadow-md rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Submit Support Request
                    </CardTitle>
                    <CardDescription>
                        Describe your issue and we'll get back to you as soon as possible
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="category" className="text-sm font-medium">Category</label>
                                <Select value={category} onValueChange={setCategory}>                  <SelectTrigger className="rounded-lg">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="technical">Technical Issue</SelectItem>
                                        <SelectItem value="account">Account Management</SelectItem>
                                        <SelectItem value="billing">Billing</SelectItem>
                                        <SelectItem value="feature">Feature Request</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                                <Select value={priority} onValueChange={setPriority}>                    <SelectTrigger className="rounded-lg">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                            <Input
                                id="subject" placeholder="Brief description of your issue"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="rounded-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium">Description</label>
                            <Textarea
                                id="description"
                                placeholder="Please provide detailed information about your issue"
                                className="min-h-[150px] rounded-xl"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full rounded-full">
                            <Mail className="mr-2 h-4 w-4" />
                            Send Support Request
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-md rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Contact Support
                        </CardTitle>
                        <CardDescription>
                            Contact our dedicated support team via email
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {supportContacts.map((contact) => (
                            <div key={contact.email} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{contact.name}</span>                                    {contact.primary && (
                                        <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium shadow-sm">
                                            Primary Contact
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    className="p-0 h-auto inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => {
                                        const subject = encodeURIComponent("Support Request: ");
                                        window.location.href = `mailto:${contact.email}?subject=${subject}`;
                                    }}
                                >
                                    <Mail className="h-4 w-4" />
                                    {contact.email}
                                </Button>
                                {!contact.primary && <Separator className="my-4" />}
                            </div>
                        ))}
                    </CardContent>
                </Card>                <Card className="border-none shadow-md rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="h-5 w-5" />
                            Documentation & Resources
                        </CardTitle>
                        <CardDescription>
                            Access helpful resources and documentation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 rounded-full"
                            onClick={() => window.location.href = '/docs'}
                        >
                            <MessagesSquare className="h-4 w-4" />
                            View Documentation
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 rounded-full"
                            onClick={() => window.location.href = '/faq'}
                        >
                            <HelpCircle className="h-4 w-4" />
                            FAQs
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
