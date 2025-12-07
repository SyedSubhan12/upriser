import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  mockBoards,
  mockSubjects,
  mockTopics,
  getSubjectsByBoard,
  getTopicsBySubject,
} from "@/lib/mockData";
import type { Topic } from "@shared/schema";

interface TopicNodeProps {
  topic: Topic;
  topics: Topic[];
  level: number;
  expandedTopics: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
  onAddChild: (parentId: string) => void;
}

function TopicNode({
  topic,
  topics,
  level,
  expandedTopics,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: TopicNodeProps) {
  const children = topics.filter((t) => t.parentId === topic.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedTopics.has(topic.id);

  return (
    <div>
      <div
        className="group flex items-center gap-2 py-2 px-3 rounded-md hover-elevate"
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        data-testid={`topic-item-${topic.id}`}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggle(topic.id)}
            className="p-0.5"
            data-testid={`button-toggle-topic-${topic.id}`}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-sm">{topic.name}</span>
        <div className="invisible group-hover:visible flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddChild(topic.id)}
            data-testid={`button-add-child-${topic.id}`}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(topic)}
            data-testid={`button-edit-topic-${topic.id}`}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(topic)}
            data-testid={`button-delete-topic-${topic.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {isExpanded &&
        children.map((child) => (
          <TopicNode
            key={child.id}
            topic={child}
            topics={topics}
            level={level + 1}
            expandedTopics={expandedTopics}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
    </div>
  );
}

export function SubjectsTopicsPage() {
  const [selectedBoardId, setSelectedBoardId] = useState<string>(mockBoards[0]?.id || "");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [parentTopicId, setParentTopicId] = useState<string | null>(null);
  const [topicForm, setTopicForm] = useState({ name: "", description: "" });

  const subjects = selectedBoardId ? getSubjectsByBoard(selectedBoardId) : [];
  const topics = selectedSubjectId ? getTopicsBySubject(selectedSubjectId) : [];
  const rootTopics = topics.filter((t) => !t.parentId);

  const handleToggleTopic = (id: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddTopic = (parentId: string | null = null) => {
    setEditingTopic(null);
    setParentTopicId(parentId);
    setTopicForm({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setParentTopicId(topic.parentId);
    setTopicForm({ name: topic.name, description: topic.description || "" });
    setIsModalOpen(true);
  };

  const handleDeleteTopic = (topic: Topic) => {
    // Placeholder for delete functionality
  };

  const handleSaveTopic = () => {
    // Placeholder for save functionality
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects & Topics"
        description="Manage subject curriculum and topic hierarchy"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Select Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board">Board</Label>
              <Select
                value={selectedBoardId}
                onValueChange={(value) => {
                  setSelectedBoardId(value);
                  setSelectedSubjectId("");
                }}
              >
                <SelectTrigger id="board" data-testid="select-board">
                  <SelectValue placeholder="Select a board" />
                </SelectTrigger>
                <SelectContent>
                  {mockBoards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={setSelectedSubjectId}
                disabled={!selectedBoardId}
              >
                <SelectTrigger id="subject" data-testid="select-subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Topic Tree</CardTitle>
            {selectedSubjectId && (
              <Button
                size="sm"
                onClick={() => handleAddTopic(null)}
                data-testid="button-add-root-topic"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Topic
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selectedSubjectId ? (
              rootTopics.length > 0 ? (
                <div className="space-y-1">
                  {rootTopics.map((topic) => (
                    <TopicNode
                      key={topic.id}
                      topic={topic}
                      topics={topics}
                      level={0}
                      expandedTopics={expandedTopics}
                      onToggle={handleToggleTopic}
                      onEdit={handleEditTopic}
                      onDelete={handleDeleteTopic}
                      onAddChild={handleAddTopic}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No topics found. Add your first topic to get started.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a board and subject to view topics.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTopic ? "Edit Topic" : "Add Topic"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topic-name">Topic Name</Label>
              <Input
                id="topic-name"
                value={topicForm.name}
                onChange={(e) =>
                  setTopicForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Linear Equations"
                data-testid="input-topic-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-description">Description</Label>
              <Textarea
                id="topic-description"
                value={topicForm.description}
                onChange={(e) =>
                  setTopicForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description of the topic..."
                rows={3}
                data-testid="input-topic-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              data-testid="button-cancel-topic"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTopic} data-testid="button-save-topic">
              {editingTopic ? "Save Changes" : "Add Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
