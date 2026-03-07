import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const studentRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  fatherName: z.string().optional(),
  board: z.string().optional(),
  qualifications: z.string().optional(),
  subject: z.string().optional(),
  phoneNumber: z.string().optional(),
  age: z.coerce.number().int().positive().max(120).optional(),
  schoolName: z.string().optional(),
});

type StudentRegistrationFormValues = z.infer<typeof studentRegistrationSchema>;

type StudentRegistrationResponse = StudentRegistrationFormValues & {
  id: string;
  userId: string;
  ipAddress: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export function StudentRegistrationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: existing, isLoading } = useQuery<StudentRegistrationResponse | null>({
    queryKey: ["/api/student/registration"],
    queryFn: async () => {
      const res = await fetch("/api/student/registration", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load registration");
      return res.json();
    },
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
    if (!existing) return;
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
  }, [existing, form]);

  const mutation = useMutation({
    mutationFn: async (values: StudentRegistrationFormValues) => {
      const res = await apiRequest("POST", "/api/student/registration", values);
      return res.json() as Promise<StudentRegistrationResponse>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/student/registration"] });
      toast({
        title: "Saved",
        description: "Your registration details have been saved.",
      });
      if (!existing) {
        setLocation("/student/dashboard");
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not save registration",
      });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Student Registration" description="Complete your student profile" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registration Form</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-student-name" />
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
                      <FormLabel>Father Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-student-father-name" />
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
                      <FormLabel>Board</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-student-board" />
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
                      <FormLabel>Qualifications</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-student-qualifications" />
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
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-student-subject" />
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
                        <Input {...field} data-testid="input-student-phone" />
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
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} data-testid="input-student-age" />
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
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-student-school" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="submit" disabled={isLoading || mutation.isPending} data-testid="button-student-registration-save">
                  {mutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
