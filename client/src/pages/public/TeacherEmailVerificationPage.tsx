import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Mail, RefreshCw } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getInitialEmail() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("email") ?? "";
}

export function TeacherEmailVerificationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState(getInitialEmail);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: payload?.error || "Unable to verify this code.",
        });
        return;
      }

      toast({
        title: "Email verified",
        description: payload?.message || "Your teacher email has been verified.",
      });
      setLocation("/login");
    } catch {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Could not resend code",
          description: payload?.error || "Unable to resend the verification code.",
        });
        return;
      }

      toast({
        title: "Verification code sent",
        description: payload?.message || "Check your inbox for the new OTP.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Could not resend code",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsResending(false);
    }
  }

  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl" data-testid="text-teacher-email-verification-title">
              Verify Teacher Email
            </CardTitle>
            <CardDescription data-testid="text-teacher-email-verification-description">
              Enter the 6-digit OTP sent to your email to activate teacher verification.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacher-verification-email">Email</Label>
                <Input
                  id="teacher-verification-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="teacher@example.com"
                  autoComplete="email"
                  data-testid="input-teacher-verification-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacher-verification-otp">Verification code</Label>
                <Input
                  id="teacher-verification-otp"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  data-testid="input-teacher-verification-otp"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying || !email.trim() || otp.trim().length !== 6}
                data-testid="button-teacher-verification-submit"
              >
                {isVerifying ? "Verifying..." : "Verify Email"}
              </Button>
            </form>

            <div className="mt-4 rounded-md bg-muted p-4 text-sm text-muted-foreground">
              Teacher accounts stay pending until the email OTP is verified. Admin approval still applies after verification.
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={isResending || !email.trim()}
              data-testid="button-teacher-verification-resend"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Sending..." : "Resend OTP"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already verified?{" "}
              <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Go to login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
}
