import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, BookOpen, HelpCircle, MessageCircle, Mail, GraduationCap, Globe, Info } from "lucide-react";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import type { Board } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";

export function HelpPage() {
    const { data: boards = [], isLoading } = useQuery<Board[]>({
        queryKey: ["/api/curriculum/boards"],
    });

    return (
        <CurriculumLayout>
            <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Help Center
                    </h1>
                    <p className="mt-3 text-lg text-muted-foreground">
                        Learn how to use Upriser and find answers to common questions
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-8">
                    {/* How to Use the App */}
                    <HelpSection
                        icon={Info}
                        title="How to Use the App"
                        description="Get started with Upriser"
                    >
                        <div className="space-y-4">
                            <div className="rounded-lg border p-4">
                                <h4 className="font-medium">1. Choose Your Curriculum</h4>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Start by selecting your education board from the home page. We support CAIE,
                                    Edexcel, and IB curricula with comprehensive resources for each.
                                </p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <h4 className="font-medium">2. Select Your Level</h4>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Choose your academic level (e.g., IGCSE, O Level, A Level for CAIE/Edexcel,
                                    or MYP/DP for IB) to access level-specific content.
                                </p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <h4 className="font-medium">3. Pick Your Subject</h4>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Browse available subjects and select the one you want to study. Each subject
                                    has its own dashboard with organized resources.
                                </p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <h4 className="font-medium">4. Access Resources</h4>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    On the subject dashboard, you'll find notes, videos, practice questions,
                                    past papers, mark schemes, and grade boundaries—all in one place.
                                </p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <h4 className="font-medium">5. Use Quick Search</h4>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Use the "Subjects" page to quickly search for any subject across all curricula.
                                    Filter by curriculum and level to narrow down results.
                                </p>
                            </div>
                        </div>
                    </HelpSection>

                    {/* Curriculum Explanations */}
                    <HelpSection
                        icon={BookOpen}
                        title="Curriculum Explanations"
                        description="Understand different education systems"
                    >
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-32 w-full rounded-lg" />
                                    <Skeleton className="h-32 w-full rounded-lg" />
                                </div>
                            ) : (
                                boards.filter(b => ['caie', 'pearson', 'ib'].includes(b.boardKey)).map((board) => (
                                    <div key={board.id} className="rounded-lg border p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                {board.boardKey === 'ib' ? (
                                                    <Globe className="h-5 w-5" />
                                                ) : (
                                                    <GraduationCap className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{board.displayName}</h4>
                                                <p className="text-sm text-muted-foreground">{board.fullName}</p>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            {board.description}
                                        </p>
                                        <Link href={`/curriculum/${board.boardKey}`}>
                                            <Button variant="outline" size="sm" className="mt-3">
                                                Browse {board.displayName}
                                            </Button>
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </HelpSection>

                    {/* FAQs */}
                    <HelpSection
                        icon={HelpCircle}
                        title="Frequently Asked Questions"
                        description="Common questions and answers"
                    >
                        <div className="space-y-2">
                            <FAQItem
                                question="Is Upriser free to use?"
                                answer="Yes! Upriser is completely free to access. Browse all curricula, subjects, and resources without any subscription or payment."
                            />
                            <FAQItem
                                question="How are the resources organized?"
                                answer="Resources are organized by curriculum, then by level/program, and finally by subject. Each subject has a dashboard with sections for notes, videos, past papers, and more."
                            />
                            <FAQItem
                                question="What curricula are supported?"
                                answer="We currently support CAIE (Cambridge Assessment International Education), Edexcel (National Curriculum for England), and IB (International Baccalaureate)."
                            />
                            <FAQItem
                                question="Can I search for a specific subject?"
                                answer="Yes! Use the 'Subjects' page in the navigation to search for any subject across all curricula. You can also filter by curriculum and level."
                            />
                            <FAQItem
                                question="Are past papers and mark schemes available?"
                                answer="Yes, each subject dashboard includes sections for past papers and mark schemes organized by examination session."
                            />
                            <FAQItem
                                question="How often is content updated?"
                                answer="We regularly update our resources to include the latest past papers, syllabi, and study materials as they become available."
                            />
                        </div>
                    </HelpSection>

                    {/* Contact/Feedback */}
                    <HelpSection
                        icon={MessageCircle}
                        title="Contact & Feedback"
                        description="Get in touch with us"
                    >
                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                We'd love to hear from you! Whether you have questions, suggestions, or feedback,
                                our team is here to help.
                            </p>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Card>
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Mail className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Email Support</p>
                                            <a
                                                href="mailto:support@upriser.com"
                                                className="text-sm text-primary hover:underline"
                                            >
                                                support@upriser.com
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <MessageCircle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Feedback Form</p>
                                            <p className="text-sm text-muted-foreground">Coming soon</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Response times may vary. We typically respond within 24-48 hours on business days.
                            </p>
                        </div>
                    </HelpSection>
                </div>
            </div>
        </CurriculumLayout>
    );
}

function HelpSection({
    icon: Icon,
    title,
    description,
    children
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 text-left hover:bg-muted/50">
                <span className="font-medium">{question}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4 pt-2">
                <p className="text-sm text-muted-foreground">{answer}</p>
            </CollapsibleContent>
        </Collapsible>
    );
}
