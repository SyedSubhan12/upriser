import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const tutorRegistrationSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    degree: z.string().min(1, "Highest degree is required"),
    subjects: z.string().min(1, "Please enter subjects you can teach (comma separated)"),
    experienceYears: z.coerce.number().int().nonnegative("Experience must be a positive number"),
    bio: z.string().min(20, "Bio should be at least 20 characters"),
    linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
});

type TutorRegistrationFormValues = z.infer<typeof tutorRegistrationSchema>;

interface TutorRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TutorRegistrationModal({ isOpen, onClose }: TutorRegistrationModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: existing, isLoading } = useQuery<any | null>({
        queryKey: ["/api/tutor/registration"],
        queryFn: async () => {
            const res = await fetch("/api/tutor/registration", { credentials: "include" });
            if (!res.ok) return null;
            const data = await res.json();
            return data;
        },
        enabled: isOpen,
    });

    const form = useForm<TutorRegistrationFormValues>({
        resolver: zodResolver(tutorRegistrationSchema),
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
            degree: "",
            subjects: "",
            experienceYears: 0,
            bio: "",
            linkedinUrl: "",
        },
    });

    useEffect(() => {
        if (existing) {
            form.reset({
                name: existing.name ?? "",
                email: existing.email ?? "",
                phoneNumber: existing.phoneNumber ?? "",
                degree: existing.degree ?? "",
                subjects: Array.isArray(existing.subjects) ? existing.subjects.join(", ") : (existing.subjects ?? ""),
                experienceYears: existing.experienceYears ?? 0,
                bio: existing.bio ?? "",
                linkedinUrl: existing.linkedinUrl ?? "",
            });
        }
    }, [existing, form]);

    const mutation = useMutation({
        mutationFn: async (values: TutorRegistrationFormValues) => {
            // Convert subjects string to array
            const payload = {
                ...values,
                subjects: values.subjects.split(",").map(s => s.trim()).filter(Boolean),
            };
            const res = await apiRequest("POST", "/api/tutor/registration", payload);
            return res.json();
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["/api/tutor/registration"] });
            toast({
                title: "Application Submitted",
                description: "Your tutor registration has been received and is under review.",
            });
            onClose();
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Submission failed",
                description: error instanceof Error ? error.message : "Could not submit application",
            });
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
            >
                <DialogHeader>
                    <DialogTitle className="text-xl">Register as a Tutor</DialogTitle>
                    <DialogDescription>
                        Join our team of expert educators. Please provide your professional details below.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Your full name" />
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
                                            <FormLabel>Work Email *</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="email" placeholder="email@example.com" />
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
                                            <FormLabel>Phone Number *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="+1234567890" />
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
                                            <FormLabel>Years of Experience *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="degree"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Highest Qualification / Degree *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Master's in Mathematics" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="subjects"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Subjects to Teach (comma separated) *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Physics, Chemistry, Calculus" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="linkedinUrl"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>LinkedIn Profile URL</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="https://linkedin.com/in/yourprofile" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Short Bio *</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    placeholder="Tell us about your teaching style and background..."
                                                    className="min-h-[100px]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end pt-4 gap-2">
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Application"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
