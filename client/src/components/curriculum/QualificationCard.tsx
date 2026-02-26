import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Qualification } from "@/lib/curriculumData";

interface QualificationCardProps {
    qualification: Qualification;
    boardKey: string;
    className?: string;
}

export function QualificationCard({ qualification, boardKey, className }: QualificationCardProps) {
    // If has branching, go to branch selector; otherwise go directly to subjects
    const href = qualification.hasBranching
        ? `/curriculum/${boardKey}/${qualification.qualKey}/branch`
        : `/curriculum/${boardKey}/${qualification.qualKey}/subjects`;

    return (
        <Link href={href}>
            <Card
                className={cn(
                    "group cursor-pointer p-5 transition-all duration-200",
                    "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
                    className
                )}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                                {qualification.displayName}
                            </CardTitle>
                            {qualification.hasBranching && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                    Current/Legacy
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="mt-1.5 line-clamp-2">
                            {getQualificationDescription(qualification.qualKey)}
                        </CardDescription>
                    </div>
                    <ArrowRight
                        className={cn(
                            "h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-all",
                            "group-hover:opacity-100 group-hover:translate-x-1"
                        )}
                    />
                </div>
            </Card>
        </Link>
    );
}

// Helper to get descriptions for qualifications
function getQualificationDescription(qualKey: string): string {
    const descriptions: Record<string, string> = {
        // CAIE
        "igcse": "International General Certificate of Secondary Education",
        "o-level": "Cambridge Ordinary Level - Traditional curriculum",
        "as-a-level": "Cambridge International AS & A Level",
        "pre-u": "Cambridge Pre-U - University preparation",

        // Pearson
        "international-gcse": "Edexcel International GCSE qualifications",
        "international-a-level": "International Advanced Level qualifications",
        "gcse": "General Certificate of Secondary Education (UK)",
        "entry-level": "Entry Level Certificate qualifications",
        "ipc": "International Primary Curriculum",

        // IB
        "myp": "Middle Years Programme - Ages 11–16",
        "dp": "Diploma Programme - Ages 16–19",

        // Others
        "a-level": "Advanced Level qualifications",
    };

    return descriptions[qualKey] || "Educational qualification";
}

// Compact list version
interface QualificationRowProps {
    qualification: Qualification;
    boardKey: string;
    className?: string;
}

export function QualificationRow({ qualification, boardKey, className }: QualificationRowProps) {
    const href = qualification.hasBranching
        ? `/curriculum/${boardKey}/${qualification.qualKey}/branch`
        : `/curriculum/${boardKey}/${qualification.qualKey}/subjects`;

    return (
        <Link href={href}>
            <div
                className={cn(
                    "group flex items-center justify-between gap-3 rounded-lg border p-4 transition-all",
                    "hover:border-primary/50 hover:bg-muted/50",
                    className
                )}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{qualification.displayName}</span>
                        {qualification.hasBranching && (
                            <Badge variant="outline" className="text-xs">
                                2 versions
                            </Badge>
                        )}
                    </div>
                </div>
                <ArrowRight
                    className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-all",
                        "group-hover:translate-x-1 group-hover:text-foreground"
                    )}
                />
            </div>
        </Link>
    );
}
