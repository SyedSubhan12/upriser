import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Plus, CheckCircle2, Clock, XCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Local validation schema (mirrors shared/schema insertTutorRegistrationSchema
// but adds UX-level constraints)
// ---------------------------------------------------------------------------
const tutorRegistrationSchema = z.object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    degree: z.string().optional(),
    experienceYears: z.coerce.number().int().nonnegative().max(60).optional(),
    bio: z.string().optional(),
    linkedinUrl: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .or(z.literal("")),
    subjects: z.array(z.string()).default([]),
    availableHours: z.string().optional(),
});

type TutorRegistrationFormValues = z.infer<typeof tutorRegistrationSchema>;

type TutorRegistrationResponse = TutorRegistrationFormValues & {
    id: string;
    userId: string;
    status: "pending" | "approved" | "rejected";
    ipAddress: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

const STATUS_CONFIG = {
    pending: {
        label: "Pending Review",
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    approved: {
        label: "Approved",
        icon: CheckCircle2,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    rejected: {
        label: "Rejected",
        icon: XCircle,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TutorRegistrationPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Subjects tag-input state
    const [subjectInput, setSubjectInput] = useState("");

    // Fetch existing registration (upsert pattern — same as StudentRegistrationPage)
    const { data: existing, isLoading } = useQuery<TutorRegistrationResponse | null>({
        queryKey: ["/api/tutor/registration"],
        queryFn: async () => {
            const res = await fetch("/api/tutor/registration", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load registration");
            return res.json();
        },
    });

    const form = useForm<TutorRegistrationFormValues>({
        resolver: zodResolver(tutorRegistrationSchema),
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
            degree: "",
            experienceYears: undefined,
            bio: "",
            linkedinUrl: "",
            subjects: [],
            availableHours: "",
        },
    });

    // Pre-populate form when existing data arrives
    useEffect(() => {
        if (!existing) return;
        form.reset({
            name: existing.name ?? "",
            email: existing.email ?? "",
            phoneNumber: existing.phoneNumber ?? "",
            degree: existing.degree ?? "",
            experienceYears: existing.experienceYears ?? undefined,
            bio: existing.bio ?? "",
            linkedinUrl: existing.linkedinUrl ?? "",
            subjects: existing.subjects ?? [],
            availableHours: existing.availableHours ?? "",
        });
    }, [existing, form]);

    // Submit mutation
    const mutation = useMutation({
        mutationFn: async (values: TutorRegistrationFormValues) => {
            const res = await apiRequest("POST", "/api/tutor/registration", values);
            return res.json() as Promise<TutorRegistrationResponse>;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["/api/tutor/registration"] });
            toast({
                title: "Application saved",
                description: "Your tutor application has been submitted for review.",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Save failed",
                description:
                    error instanceof Error ? error.message : "Could not save registration",
            });
        },
    });

    // ---------- subjects tag helpers ----------
    const watchedSubjects = form.watch("subjects");

    const addSubject = () => {
        const trimmed = subjectInput.trim();
        if (!trimmed) return;
        if (watchedSubjects.includes(trimmed)) {
            setSubjectInput("");
            return;
        }
        form.setValue("subjects", [...watchedSubjects, trimmed]);
        setSubjectInput("");
    };

    const removeSubject = (subject: string) => {
        form.setValue(
            "subjects",
            watchedSubjects.filter((s) => s !== subject),
        );
    };

    const handleSubjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSubject();
        }
    };

    // ---------- status badge ----------
    const status = existing?.status ?? null;
    const statusCfg = status ? STATUS_CONFIG[status] : null;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tutor Registration"
                description="Apply to become a verified tutor on ExamsValley"
            />

            {/* Status banner */}
            {statusCfg && (
                <div
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${statusCfg.className}`}
                >
                    <statusCfg.icon className="h-4 w-4 shrink-0" />
                    <span>Application status: <strong>{statusCfg.label}</strong></span>
                    {status === "approved" && (
                        <span className="ml-1 text-xs font-normal opacity-80">
                            — Congratulations! Your profile is live.
                        </span>
                    )}
                    {status === "rejected" && (
                        <span className="ml-1 text-xs font-normal opacity-80">
                            — You may update and resubmit your application.
                        </span>
                    )}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Application Form</CardTitle>
                    <CardDescription>
                        Fill in your professional details. All fields except your name and email
                        are optional but help your application stand out.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
                            className="space-y-6"
                        >
                            {/* ── Personal Information ── */}
                            <fieldset className="space-y-4">
                                <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Personal Information
                                </legend>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="e.g. Ahmed Khan"
                                                        data-testid="input-tutor-name"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="email"
                                                        placeholder="e.g. ahmed@example.com"
                                                        data-testid="input-tutor-email"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="+92 300 0000000"
                                                        data-testid="input-tutor-phone"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="linkedinUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>LinkedIn Profile URL</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="https://linkedin.com/in/your-profile"
                                                        data-testid="input-tutor-linkedin"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="availableHours"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Available Hours</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="e.g. Mon-Fri 4PM-8PM"
                                                        data-testid="input-tutor-hours"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </fieldset>

                            {/* ── Academic & Professional ── */}
                            <fieldset className="space-y-4">
                                <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Academic &amp; Professional Background
                                </legend>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="degree"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Highest Degree</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="e.g. BSc Computer Science"
                                                        data-testid="input-tutor-degree"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="experienceYears"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Years of Teaching Experience</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={60}
                                                        {...field}
                                                        value={field.value ?? ""}
                                                        placeholder="e.g. 3"
                                                        data-testid="input-tutor-experience"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Subjects tag-input */}
                                <FormField
                                    control={form.control}
                                    name="subjects"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Subjects You Can Teach</FormLabel>
                                            <div className="flex flex-wrap gap-2 rounded-md border bg-background px-3 py-2 min-h-[42px]">
                                                {watchedSubjects.map((s) => (
                                                    <Badge
                                                        key={s}
                                                        variant="secondary"
                                                        className="flex items-center gap-1 pr-1"
                                                    >
                                                        {s}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSubject(s)}
                                                            className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                                            data-testid={`badge-remove-subject-${s}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                                <div className="flex items-center gap-1 flex-1 min-w-[160px]">
                                                    <input
                                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                                        placeholder="Type a subject and press Enter…"
                                                        value={subjectInput}
                                                        onChange={(e) => setSubjectInput(e.target.value)}
                                                        onKeyDown={handleSubjectKeyDown}
                                                        data-testid="input-tutor-subject-tag"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addSubject}
                                                        className="shrink-0 rounded p-0.5 hover:bg-muted"
                                                        data-testid="button-tutor-add-subject"
                                                    >
                                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                                    </button>
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Bio */}
                                <FormField
                                    control={form.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bio / Statement of Purpose</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    rows={4}
                                                    placeholder="Tell us about your teaching philosophy, specialisations, and what makes you a great tutor…"
                                                    data-testid="textarea-tutor-bio"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </fieldset>

                            {/* ── Save ── */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={isLoading || mutation.isPending}
                                    data-testid="button-tutor-registration-save"
                                >
                                    {mutation.isPending
                                        ? "Saving…"
                                        : existing
                                            ? "Update Application"
                                            : "Submit Application"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
