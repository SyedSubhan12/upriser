import { useQuery } from "@tanstack/react-query";
import { fetchFeedback, FeedbackItem } from "@/api/admin";
import { Loader2, Star, User } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function FeedbackPage() {
    const { data: feedback, isLoading } = useQuery<FeedbackItem[]>({
        queryKey: ["admin-feedback"],
        queryFn: fetchFeedback,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const feedbacks = feedback || [];

    // Calculate average rating
    const averageRating = feedbacks.length > 0
        ? feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Feedback</h1>
                    <p className="text-muted-foreground mt-2">
                        View ratings and comments from users.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Card className="w-[200px]">
                        <CardHeader className="py-4 pb-2">
                            <CardDescription>Average Rating</CardDescription>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                {averageRating.toFixed(1)} <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="w-[150px]">
                        <CardHeader className="py-4 pb-2">
                            <CardDescription>Total Responses</CardDescription>
                            <CardTitle className="text-2xl">
                                {feedbacks.length}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Feedback</CardTitle>
                    <CardDescription>
                        Latest responses from users about their experience.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead className="w-[40%]">Comment</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {feedbacks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No feedback submitted yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                feedbacks.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>
                                                        {item.userName ? item.userName[0].toUpperCase() : <User className="h-4 w-4" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">
                                                        {item.userName || "Anonymous"}
                                                    </span>
                                                    {item.userEmail && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.userEmail}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${i < item.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                                    />
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.comment ? (
                                                <p className="text-sm">{item.comment}</p>
                                            ) : (
                                                <span className="text-sm text-muted-foreground italic">No comment</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
