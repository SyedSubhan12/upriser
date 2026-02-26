import { Link } from "wouter";
import { ArrowRight, Calculator, Atom, FlaskConical, Leaf, Laptop, Book, TrendingUp, Briefcase, Globe, Landmark, Brain, Languages, Palette, Music, Video, Users, PencilRuler, HeartPulse, BookOpen, Receipt, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Subject } from "@/lib/curriculumData";

// Icon mapping
const subjectIcons: Record<string, typeof Calculator> = {
    calculator: Calculator,
    atom: Atom,
    "flask-conical": FlaskConical,
    leaf: Leaf,
    laptop: Laptop,
    book: Book,
    "book-open": BookOpen,
    "trending-up": TrendingUp,
    briefcase: Briefcase,
    globe: Globe,
    landmark: Landmark,
    brain: Brain,
    languages: Languages,
    palette: Palette,
    music: Music,
    video: Video,
    users: Users,
    "pencil-ruler": PencilRuler,
    "heart-pulse": HeartPulse,
    receipt: Receipt,
    drama: GraduationCap, // Fallback for theater
    "tree-deciduous": Leaf, // Fallback for environmental
};

interface SubjectRowProps {
    subject: Subject;
    className?: string;
}

export function SubjectRow({ subject, className }: SubjectRowProps) {
    const Icon = subjectIcons[subject.icon || "book"] || Book;

    return (
        <Link href={`/subject/${subject.id}`}>
            <div
                className={cn(
                    "group flex items-center gap-4 rounded-lg border p-4 transition-all",
                    "hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm",
                    className
                )}
            >
                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{subject.subjectName}</h3>
                        {subject.subjectCode && (
                            <Badge variant="secondary" className="shrink-0 text-xs">
                                {subject.subjectCode}
                            </Badge>
                        )}
                    </div>
                    {(subject.versionTag || subject.description) && (
                        <p className="mt-0.5 text-sm text-muted-foreground truncate">
                            {subject.versionTag && (
                                <span className="font-medium">{subject.versionTag} Syllabus</span>
                            )}
                            {subject.versionTag && subject.description && " • "}
                            {subject.description}
                        </p>
                    )}
                </div>

                {/* Arrow */}
                <ArrowRight
                    className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-all",
                        "group-hover:translate-x-1 group-hover:text-foreground"
                    )}
                />
            </div>
        </Link>
    );
}

// Compact version for dense lists
interface SubjectRowCompactProps {
    subject: Subject;
    className?: string;
}

export function SubjectRowCompact({ subject, className }: SubjectRowCompactProps) {
    return (
        <Link href={`/subject/${subject.id}`}>
            <div
                className={cn(
                    "group flex items-center justify-between gap-3 rounded-md px-3 py-2.5 transition-all",
                    "hover:bg-muted",
                    className
                )}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="truncate">{subject.subjectName}</span>
                        {subject.subjectCode && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                                ({subject.subjectCode})
                            </span>
                        )}
                    </div>
                </div>
                <ArrowRight
                    className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all",
                        "group-hover:opacity-100 group-hover:translate-x-0.5"
                    )}
                />
            </div>
        </Link>
    );
}

// Card version for grid layouts
interface SubjectCardProps {
    subject: Subject;
    className?: string;
}

export function SubjectCard({ subject, className }: SubjectCardProps) {
    const Icon = subjectIcons[subject.icon || "book"] || Book;

    return (
        <Link href={`/subject/${subject.id}`}>
            <div
                className={cn(
                    "group rounded-lg border p-4 transition-all",
                    "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
                    className
                )}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{subject.subjectName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            {subject.subjectCode && (
                                <span className="text-xs text-muted-foreground">
                                    {subject.subjectCode}
                                </span>
                            )}
                            {subject.versionTag && (
                                <Badge variant="outline" className="text-xs">
                                    {subject.versionTag}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// Helper function to get icon component
export function getSubjectIcon(iconName?: string) {
    return subjectIcons[iconName || "book"] || Book;
}
