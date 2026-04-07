import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const studentRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  board: z.string().min(1, "Board is required"),
  qualifications: z.string().min(1, "Qualifications are required"),
  subject: z.string().min(1, "Subject is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  age: z.coerce.number().int().positive().min(10, "Age must be at least 10").max(25, "Age must be 25 or less"),
  schoolName: z.string().min(1, "School name is required"),
});

type StudentRegistrationFormValues = z.infer<typeof studentRegistrationSchema>;

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentRegistrationModal({ isOpen, onClose }: StudentRegistrationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('[StudentRegistrationModal] isOpen:', isOpen);

  const { data: existing, isLoading } = useQuery<StudentRegistrationFormValues | null>({
    queryKey: ["/api/student/registration"],
    queryFn: async () => {
      const res = await fetch("/api/student/registration", { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    },
    enabled: isOpen,
  });

  const form = useForm<StudentRegistrationFormValues>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      name: "",
      fatherName: "",
      board: "",
      qualifications: "",
      subject: "",
      phoneNumber: "",
      age: undefined,
      schoolName: "",
    },
  });

  useEffect(() => {
    if (existing) {
      form.reset({
        name: existing.name ?? "",
        fatherName: existing.fatherName ?? "",
        board: existing.board ?? "",
        qualifications: existing.qualifications ?? "",
        subject: existing.subject ?? "",
        phoneNumber: existing.phoneNumber ?? "",
        age: existing.age ?? undefined,
        schoolName: existing.schoolName ?? "",
      });
    }
  }, [existing, form]);

  const mutation = useMutation({
    mutationFn: async (values: StudentRegistrationFormValues) => {
      const res = await apiRequest("POST", "/api/student/registration", values);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/student/registration"] });
      toast({
        title: "Registration Complete",
        description: "Your profile has been saved successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not save registration",
      });
    },
  });

  // If they already have registration data, close the modal
  useEffect(() => {
    if (existing && !isLoading) {
      onClose();
    }
  }, [existing, isLoading, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please fill in your details to continue. This information is required for all students.
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
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Father's name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Your age"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your phone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="board"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., CAIE, Edexcel, IB" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qualifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualifications *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., IGCSE, A-Level" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Subject *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your main subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your school name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Complete Registration"
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
