import { Link } from "wouter";
import { BookOpen, GraduationCap, TrendingUp, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/layouts/PublicLayout";

const features = [
  {
    id: "study-materials",
    icon: BookOpen,
    title: "Study Materials",
    description: "Access comprehensive study resources including notes, past papers, and worksheets organized by board and subject.",
  },
  {
    id: "interactive-quizzes",
    icon: GraduationCap,
    title: "Interactive Quizzes",
    description: "Test your knowledge with practice quizzes and mock exams designed to prepare you for success.",
  },
  {
    id: "progress-tracking",
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Monitor your learning journey with detailed analytics and performance insights.",
  },
  {
    id: "expert-teachers",
    icon: Users,
    title: "Expert Teachers",
    description: "Learn from experienced educators who create quality content and provide guidance.",
  },
];

const benefits = [
  "Board-specific curriculum (CBSE, ICSE, State Boards)",
  "Organized by subjects and topics",
  "Regular content updates",
  "Accessible anytime, anywhere",
  "Track your learning progress",
  "Practice with real exam patterns",
];

export function LandingPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <h1 
              className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
              data-testid="text-hero-headline"
            >
              Empower Your Learning Journey
            </h1>
            <p 
              className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl"
              data-testid="text-hero-subheadline"
            >
              A comprehensive educational platform designed to help students excel with quality study materials, interactive quizzes, and personalized progress tracking.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" data-testid="button-hero-get-started">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" data-testid="button-hero-learn-more">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold md:text-3xl" data-testid="text-features-title">
              Everything You Need to Succeed
            </h2>
            <p className="mt-2 text-muted-foreground">
              Comprehensive tools and resources to support your educational journey
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card 
                key={feature.id} 
                className="text-center"
                data-testid={`card-feature-${feature.id}`}
              >
                <CardContent className="pt-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold" data-testid={`text-feature-title-${feature.id}`}>
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl" data-testid="text-benefits-title">
                Why Choose Upriser?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Join thousands of students who have improved their academic performance with our platform.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit, index) => (
                  <li 
                    key={index} 
                    className="flex items-start gap-3"
                    data-testid={`text-benefit-${index}`}
                  >
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <Card className="w-full max-w-md">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary" data-testid="text-stat-students">
                      1000+
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Active Students</p>
                  </div>
                  <div className="my-6 border-t" />
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary" data-testid="text-stat-materials">
                      500+
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Study Materials</p>
                  </div>
                  <div className="my-6 border-t" />
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary" data-testid="text-stat-quizzes">
                      100+
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Practice Quizzes</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
          <h2 className="text-2xl font-bold md:text-3xl" data-testid="text-cta-title">
            Ready to Start Learning?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join our platform today and take the first step towards academic excellence.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" data-testid="button-cta-signup">
                Create Free Account
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" data-testid="button-cta-login">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
