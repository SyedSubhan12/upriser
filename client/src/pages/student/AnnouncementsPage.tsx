import { useState } from "react";
import { Bell, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { mockAnnouncements, mockSubjects } from "@/lib/mockData";
import type { Announcement } from "@shared/schema";

interface AnnouncementCardProps {
  announcement: Announcement;
}

function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const subject = announcement.subjectId
    ? mockSubjects.find((s) => s.id === announcement.subjectId)
    : null;

  const getScopeBadgeVariant = (scope: string) => {
    switch (scope) {
      case "school":
        return "default";
      case "board":
        return "secondary";
      case "subject":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case "school":
        return "School-wide";
      case "board":
        return "Board";
      case "subject":
        return subject?.name || "Subject";
      default:
        return scope;
    }
  };

  const contentPreview =
    announcement.content.length > 150
      ? announcement.content.slice(0, 150) + "..."
      : announcement.content;

  const needsExpand = announcement.content.length > 150;

  return (
    <Card data-testid={`announcement-card-${announcement.id}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getScopeBadgeVariant(announcement.scope)}>
                {getScopeLabel(announcement.scope)}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {announcement.createdAt
                  ? new Date(announcement.createdAt).toLocaleDateString()
                  : "Unknown date"}
              </span>
            </div>
            {needsExpand && (
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid={`button-expand-${announcement.id}`}
                >
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
          <CardTitle className="text-base mt-2">{announcement.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {needsExpand ? (
            <>
              {!isOpen && (
                <p className="text-sm text-muted-foreground">{contentPreview}</p>
              )}
              <CollapsibleContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </CollapsibleContent>
            </>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {announcement.content}
            </p>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  );
}

export function AnnouncementsPage() {
  const announcements = mockAnnouncements
    .filter((a) => a.isActive)
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Stay updated with the latest news and updates"
      />

      {announcements.length > 0 ? (
        <div className="space-y-4" data-testid="announcements-list">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No announcements at this time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
