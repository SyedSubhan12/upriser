import { useParams, Link } from "wouter";
import { ChevronRight, ChevronDown, Info, List, FileText, Video, HelpCircle, File, CheckSquare, BarChart2 } from "lucide-react";
import { useState } from "react";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    getSubjectById,
    getCurriculumById,
    getLevelById,
    getProgramById,
    getSubjectGroupById,
    subjectSections,
    type SubjectSection
} from "@/lib/curriculumData";

// Icon mapping for sections
const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'info': Info,
    'list': List,
    'file-text': FileText,
    'video': Video,
    'help-circle': HelpCircle,
    'file': File,
    'check-square': CheckSquare,
    'bar-chart-2': BarChart2,
};

export function SubjectDashboard() {
    const { subjectId } = useParams<{ subjectId: string }>();
    const subject = getSubjectById(subjectId || "");

    // Track which sections are open
    const [openSections, setOpenSections] = useState<string[]>(['overview', 'syllabus']);

    if (!subject) {
        return (
            <CurriculumLayout>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Subject Not Found</h1>
                        <p className="mt-2 text-muted-foreground">The requested subject does not exist.</p>
                        <Link href="/subjects" className="mt-4 inline-block text-primary hover:underline">
                            ← Search Subjects
                        </Link>
                    </div>
                </div>
            </CurriculumLayout>
        );
    }

    const curriculum = getCurriculumById(subject.curriculumId);
    const level = subject.levelId ? getLevelById(subject.levelId) : null;
    const program = subject.programId ? getProgramById(subject.programId) : null;
    const subjectGroup = subject.subjectGroupId ? getSubjectGroupById(subject.subjectGroupId) : null;

    // Build breadcrumbs
    const breadcrumbs: { label: string; href?: string }[] = [
        { label: "Curriculum", href: "/curriculum" },
    ];

    if (curriculum) {
        breadcrumbs.push({ label: curriculum.name, href: `/curriculum/${curriculum.id}` });
    }

    if (level) {
        breadcrumbs.push({ label: level.name, href: `/curriculum/${curriculum?.id}/${level.id}` });
    } else if (program) {
        if (subjectGroup) {
            breadcrumbs.push({ label: program.name, href: `/curriculum/${curriculum?.id}/${program.id}/groups` });
            breadcrumbs.push({ label: subjectGroup.name, href: `/curriculum/${curriculum?.id}/${program.id}/${subjectGroup.id}` });
        } else {
            breadcrumbs.push({ label: program.name, href: `/curriculum/${curriculum?.id}/${program.id}` });
        }
    }

    breadcrumbs.push({ label: subject.name });

    const toggleSection = (sectionId: string) => {
        setOpenSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    return (
        <CurriculumLayout>
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
                {/* Breadcrumb */}
                <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={index} className="flex items-center gap-2">
                            {index > 0 && <ChevronRight className="h-4 w-4" />}
                            {crumb.href ? (
                                <Link href={crumb.href} className="hover:text-foreground">
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-foreground">{crumb.label}</span>
                            )}
                        </span>
                    ))}
                </nav>

                {/* Subject Header */}
                <div className="mb-10">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {curriculum?.name}
                        </span>
                        <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                            {level?.name || program?.name}
                        </span>
                        {subjectGroup && (
                            <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                                {subjectGroup.name}
                            </span>
                        )}
                    </div>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                        {subject.name}
                    </h1>
                    <p className="mt-3 max-w-3xl text-muted-foreground">
                        {subject.description}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Subject Code: {subject.code}
                    </p>
                </div>

                {/* Subject Dashboard Sections */}
                <div className="space-y-4">
                    {subjectSections.map((section) => (
                        <DashboardSection
                            key={section.id}
                            section={section}
                            isOpen={openSections.includes(section.id)}
                            onToggle={() => toggleSection(section.id)}
                            subjectName={subject.name}
                        />
                    ))}
                </div>
            </div>
        </CurriculumLayout>
    );
}

function DashboardSection({
    section,
    isOpen,
    onToggle,
    subjectName
}: {
    section: SubjectSection;
    isOpen: boolean;
    onToggle: () => void;
    subjectName: string;
}) {
    const Icon = sectionIcons[section.icon] || Info;

    // Sample content for each section type
    const getSectionContent = () => {
        switch (section.contentType) {
            case 'overview':
                return (
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            This section provides an introduction to {subjectName}, including key objectives,
                            assessment structure, and important information about the course.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border p-4">
                                <h4 className="font-medium">Course Duration</h4>
                                <p className="mt-1 text-sm text-muted-foreground">1-2 Academic Years</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <h4 className="font-medium">Assessment Type</h4>
                                <p className="mt-1 text-sm text-muted-foreground">Written Examinations</p>
                            </div>
                        </div>
                    </div>
                );
            case 'syllabus':
                return (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-4">Complete syllabus outline with all topics and subtopics.</p>
                        {['Unit 1: Introduction', 'Unit 2: Core Concepts', 'Unit 3: Applications', 'Unit 4: Advanced Topics'].map((unit, i) => (
                            <div key={i} className="rounded-lg border p-3">
                                <p className="font-medium">{unit}</p>
                            </div>
                        ))}
                    </div>
                );
            case 'notes':
                return (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {['Chapter 1 Notes', 'Chapter 2 Notes', 'Chapter 3 Notes', 'Revision Summary'].map((note, i) => (
                            <Card key={i} className="cursor-pointer hover-elevate">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <span className="text-sm">{note}</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            case 'videos':
                return (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {['Introduction Video', 'Topic 1 Explained', 'Problem Solving Tips', 'Exam Preparation'].map((video, i) => (
                            <Card key={i} className="cursor-pointer hover-elevate">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <Video className="h-5 w-5 text-primary" />
                                    <span className="text-sm">{video}</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            case 'practice':
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Practice questions organized by topic.</p>
                        {['Topic 1 Questions', 'Topic 2 Questions', 'Mixed Practice'].map((item, i) => (
                            <Card key={i} className="cursor-pointer hover-elevate">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <HelpCircle className="h-5 w-5 text-primary" />
                                        <span className="text-sm">{item}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">20 questions</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            case 'past-papers':
                return (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {['2024 May/June', '2023 Oct/Nov', '2023 May/June', '2022 Oct/Nov', '2022 May/June', '2021 Oct/Nov'].map((paper, i) => (
                            <Card key={i} className="cursor-pointer hover-elevate">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <File className="h-5 w-5 text-primary" />
                                    <span className="text-sm">{paper}</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            case 'mark-schemes':
                return (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {['2024 May/June MS', '2023 Oct/Nov MS', '2023 May/June MS', '2022 Oct/Nov MS'].map((ms, i) => (
                            <Card key={i} className="cursor-pointer hover-elevate">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <CheckSquare className="h-5 w-5 text-primary" />
                                    <span className="text-sm">{ms}</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            case 'grade-boundaries':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Historical grade boundaries for this subject.</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-2 text-left font-medium">Session</th>
                                        <th className="py-2 text-center font-medium">A*</th>
                                        <th className="py-2 text-center font-medium">A</th>
                                        <th className="py-2 text-center font-medium">B</th>
                                        <th className="py-2 text-center font-medium">C</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { session: 'May/June 2024', grades: [90, 80, 70, 60] },
                                        { session: 'Oct/Nov 2023', grades: [88, 78, 68, 58] },
                                        { session: 'May/June 2023', grades: [89, 79, 69, 59] },
                                    ].map((row, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="py-2">{row.session}</td>
                                            {row.grades.map((grade, j) => (
                                                <td key={j} className="py-2 text-center">{grade}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return <p className="text-muted-foreground">Content coming soon...</p>;
        }
    };

    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <Card>
                <CollapsibleTrigger className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <CardTitle className="text-base">{section.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">{section.description}</p>
                            </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="border-t px-4 py-6">
                        {getSectionContent()}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
