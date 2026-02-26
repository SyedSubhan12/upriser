import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
    ChevronLeft,
    ChevronRight,
    Sparkles,
    BookOpen,
    GraduationCap,
    Target,
    CheckCircle2,
    Clock,
    Zap,
    SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SubjectMultiSelect, type SubjectOption } from "./SubjectMultiSelect";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

// Types
interface OnboardingData {
    boardKey: string;
    qualKey: string;
    programKey?: string;
    subjectIds: string[];
    studyMinutesDaily: number;
    difficulty: string;
    resourceFocus: string[];
    examSessionTarget?: string;
}

interface OnboardingWizardProps {
    open: boolean;
    onComplete: (data: OnboardingData) => void;
    onSkip: () => void;
}

const STEPS = [
    { id: 1, title: "Welcome", icon: Sparkles },
    { id: 2, title: "Board", icon: GraduationCap },
    { id: 3, title: "Subjects", icon: BookOpen },
    { id: 4, title: "Preferences", icon: Target },
    { id: 5, title: "Review", icon: CheckCircle2 },
];

const BOARDS = [
    { key: "caie", name: "Cambridge CAIE", description: "Cambridge Assessment International Education" },
    { key: "pearson", name: "Pearson Edexcel", description: "Pearson Edexcel International" },
    { key: "ib", name: "IB", description: "International Baccalaureate" },
];

const QUALIFICATIONS: Record<string, { key: string; name: string }[]> = {
    caie: [
        { key: "igcse", name: "IGCSE" },
        { key: "as", name: "AS Level" },
        { key: "alevel", name: "A Level" },
    ],
    pearson: [
        { key: "igcse", name: "International GCSE" },
        { key: "ial", name: "International A Level" },
    ],
    ib: [
        { key: "dp", name: "Diploma Programme" },
        { key: "myp", name: "Middle Years Programme" },
    ],
};

const RESOURCE_OPTIONS = [
    { key: "past_papers", label: "Past Papers", icon: "📝" },
    { key: "notes", label: "Notes", icon: "📚" },
    { key: "videos", label: "Videos", icon: "🎬" },
    { key: "worksheets", label: "Worksheets", icon: "📋" },
];

const EXAM_SESSIONS = [
    { value: "m25", label: "May/June 2025" },
    { value: "o25", label: "Oct/Nov 2025" },
    { value: "m26", label: "May/June 2026" },
];

export function OnboardingWizard({ open, onComplete, onSkip }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Form state
    const [boardKey, setBoardKey] = useState("");
    const [qualKey, setQualKey] = useState("");
    const [subjectIds, setSubjectIds] = useState<string[]>([]);
    const [studyMinutes, setStudyMinutes] = useState(30);
    const [difficulty, setDifficulty] = useState("medium");
    const [resourceFocus, setResourceFocus] = useState<string[]>(["past_papers"]);
    const [examSession, setExamSession] = useState("");
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    // Load subjects when board/qual changes
    useEffect(() => {
        const loadSubjects = async () => {
            if (!boardKey || !qualKey) return;

            setLoadingSubjects(true);
            try {
                const response = await fetch("/api/curriculum/subjects");
                if (response.ok) {
                    const data = await response.json();
                    // Filter by board if needed
                    const filtered = data.filter((s: any) =>
                        s.boardId && s.qualId
                    ).map((s: any) => ({
                        id: s.id,
                        name: s.subjectName,
                        code: s.subjectCode,
                    }));
                    setSubjects(filtered);
                }
            } catch (error) {
                console.error("Error loading subjects:", error);
            } finally {
                setLoadingSubjects(false);
            }
        };

        loadSubjects();
    }, [boardKey, qualKey]);

    const handleNext = () => {
        if (step < 5) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            const data: OnboardingData = {
                boardKey,
                qualKey,
                subjectIds,
                studyMinutesDaily: studyMinutes,
                difficulty,
                resourceFocus,
                examSessionTarget: examSession || undefined,
            };
            await onComplete(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save preferences. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResourceToggle = (key: string) => {
        setResourceFocus((prev) =>
            prev.includes(key)
                ? prev.filter((k) => k !== key)
                : [...prev, key]
        );
    };

    const progress = (step / 5) * 100;

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center text-center gap-6 py-4"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-30" />
                            <div className="relative p-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full">
                                <Sparkles className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Welcome to Upriser!</h2>
                            <p className="text-muted-foreground max-w-md">
                                Let's personalize your learning experience. This will only take a minute.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Choose your exam board</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Select your subjects</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Set your study preferences</span>
                            </div>
                        </div>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        key="board"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-semibold">Choose Your Exam Board</h2>
                            <p className="text-sm text-muted-foreground">
                                Select the examination board you're studying under
                            </p>
                        </div>

                        <div className="grid gap-3">
                            {BOARDS.map((board) => (
                                <Card
                                    key={board.key}
                                    className={`cursor-pointer transition-all hover:border-primary ${boardKey === board.key ? "border-primary bg-primary/5" : ""
                                        }`}
                                    onClick={() => {
                                        setBoardKey(board.key);
                                        setQualKey("");
                                    }}
                                >
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <GraduationCap className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{board.name}</p>
                                            <p className="text-xs text-muted-foreground">{board.description}</p>
                                        </div>
                                        {boardKey === board.key && (
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {boardKey && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-3"
                            >
                                <Label>Qualification Level</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {QUALIFICATIONS[boardKey]?.map((qual) => (
                                        <Button
                                            key={qual.key}
                                            variant={qualKey === qual.key ? "default" : "outline"}
                                            className="w-full"
                                            onClick={() => setQualKey(qual.key)}
                                        >
                                            {qual.name}
                                        </Button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        key="subjects"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-semibold">Select Your Subjects</h2>
                            <p className="text-sm text-muted-foreground">
                                Choose the subjects you're studying (up to 10)
                            </p>
                        </div>

                        <SubjectMultiSelect
                            subjects={subjects}
                            selectedIds={subjectIds}
                            onSelectionChange={setSubjectIds}
                            placeholder="Search and select subjects..."
                            maxSelections={10}
                            disabled={loadingSubjects}
                        />

                        {subjectIds.length > 0 && (
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    <strong>{subjectIds.length}</strong> subject{subjectIds.length !== 1 ? "s" : ""} selected
                                </p>
                            </div>
                        )}
                    </motion.div>
                );

            case 4:
                return (
                    <motion.div
                        key="preferences"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-semibold">Study Preferences</h2>
                            <p className="text-sm text-muted-foreground">
                                Customize your learning experience
                            </p>
                        </div>

                        {/* Study duration */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Daily study goal
                                </Label>
                                <span className="text-sm font-medium">{studyMinutes} min</span>
                            </div>
                            <Slider
                                value={[studyMinutes]}
                                onValueChange={([v]) => setStudyMinutes(v)}
                                min={15}
                                max={120}
                                step={15}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>15 min</span>
                                <span>1 hour</span>
                                <span>2 hours</span>
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Practice difficulty
                            </Label>
                            <ToggleGroup
                                type="single"
                                value={difficulty}
                                onValueChange={(v) => v && setDifficulty(v)}
                                className="justify-start"
                            >
                                <ToggleGroupItem value="easy" className="flex-1">Easy</ToggleGroupItem>
                                <ToggleGroupItem value="medium" className="flex-1">Medium</ToggleGroupItem>
                                <ToggleGroupItem value="hard" className="flex-1">Hard</ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        {/* Resource focus */}
                        <div className="space-y-3">
                            <Label>Resource focus (select all that apply)</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {RESOURCE_OPTIONS.map((opt) => (
                                    <Button
                                        key={opt.key}
                                        variant={resourceFocus.includes(opt.key) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleResourceToggle(opt.key)}
                                        className="justify-start gap-2"
                                    >
                                        <span>{opt.icon}</span>
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Exam session target (optional) */}
                        <div className="space-y-3">
                            <Label>Target exam session (optional)</Label>
                            <Select value={examSession} onValueChange={setExamSession}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select session..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {EXAM_SESSIONS.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </motion.div>
                );

            case 5:
                return (
                    <motion.div
                        key="review"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center space-y-2">
                            <div className="inline-flex p-3 rounded-full bg-green-500/10 mb-2">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-xl font-semibold">You're All Set!</h2>
                            <p className="text-sm text-muted-foreground">
                                Here's a summary of your preferences
                            </p>
                        </div>

                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm text-muted-foreground">Board</span>
                                    <Badge variant="secondary">
                                        {BOARDS.find((b) => b.key === boardKey)?.name || "Not selected"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm text-muted-foreground">Level</span>
                                    <Badge variant="secondary">
                                        {QUALIFICATIONS[boardKey]?.find((q) => q.key === qualKey)?.name || "Not selected"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm text-muted-foreground">Subjects</span>
                                    <Badge variant="secondary">{subjectIds.length} selected</Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm text-muted-foreground">Daily goal</span>
                                    <Badge variant="secondary">{studyMinutes} minutes</Badge>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-muted-foreground">Difficulty</span>
                                    <Badge variant="secondary" className="capitalize">{difficulty}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    const content = (
        <div className="flex flex-col h-full max-h-[80vh]">
            {/* Progress bar */}
            <div className="px-6 py-4 border-b space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Step {step} of 5</span>
                    <span className="font-medium">{STEPS[step - 1].title}</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <AnimatePresence mode="wait">
                    {renderStepContent()}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="px-6 py-4 border-t flex items-center justify-between gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSkip}
                    className="text-muted-foreground"
                >
                    <SkipForward className="w-4 h-4 mr-1" />
                    Skip for now
                </Button>

                <div className="flex gap-2">
                    {step > 1 && (
                        <Button variant="outline" onClick={handleBack}>
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>
                    )}
                    {step < 5 ? (
                        <Button
                            onClick={handleNext}
                            disabled={step === 2 && (!boardKey || !qualKey)}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleComplete}
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                            {isSubmitting ? "Saving..." : "Get Started"}
                            <Sparkles className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    // Responsive: Dialog on desktop, Drawer on mobile
    if (isDesktop) {
        return (
            <Dialog open={open} modal>
                <DialogContent className="sm:max-w-[500px] p-0 gap-0 [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Onboarding</DialogTitle>
                        <DialogDescription>Set up your learning preferences</DialogDescription>
                    </DialogHeader>
                    {content}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} modal>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="sr-only">
                    <DrawerTitle>Onboarding</DrawerTitle>
                    <DrawerDescription>Set up your learning preferences</DrawerDescription>
                </DrawerHeader>
                {content}
            </DrawerContent>
        </Drawer>
    );
}
