import { useState, useMemo } from "react";
import { Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SubjectOption {
    id: string;
    name: string;
    code?: string;
    boardKey?: string;
    qualKey?: string;
}

interface SubjectMultiSelectProps {
    subjects: SubjectOption[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    placeholder?: string;
    maxSelections?: number;
    disabled?: boolean;
}

export function SubjectMultiSelect({
    subjects,
    selectedIds,
    onSelectionChange,
    placeholder = "Select subjects...",
    maxSelections = 10,
    disabled = false,
}: SubjectMultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const selectedSubjects = useMemo(() => {
        return subjects.filter((s) => selectedIds.includes(s.id));
    }, [subjects, selectedIds]);

    const filteredSubjects = useMemo(() => {
        if (!searchQuery) return subjects;
        const query = searchQuery.toLowerCase();
        return subjects.filter(
            (s) =>
                s.name.toLowerCase().includes(query) ||
                s.code?.toLowerCase().includes(query)
        );
    }, [subjects, searchQuery]);

    const handleSelect = (subjectId: string) => {
        if (selectedIds.includes(subjectId)) {
            // Remove
            onSelectionChange(selectedIds.filter((id) => id !== subjectId));
        } else {
            // Add (if under limit)
            if (selectedIds.length < maxSelections) {
                onSelectionChange([...selectedIds, subjectId]);
            }
        }
    };

    const handleRemove = (subjectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectionChange(selectedIds.filter((id) => id !== subjectId));
    };

    return (
        <div className="w-full space-y-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between min-h-[44px] h-auto py-2",
                            !selectedIds.length && "text-muted-foreground"
                        )}
                        disabled={disabled}
                    >
                        <span className="flex items-center gap-2">
                            <Search className="w-4 h-4 shrink-0" />
                            {selectedIds.length > 0
                                ? `${selectedIds.length} subject${selectedIds.length > 1 ? "s" : ""} selected`
                                : placeholder}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {selectedIds.length}/{maxSelections}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search subjects..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList className="max-h-[300px]">
                            <CommandEmpty>No subjects found.</CommandEmpty>
                            <CommandGroup>
                                {filteredSubjects.map((subject) => {
                                    const isSelected = selectedIds.includes(subject.id);
                                    const isDisabled =
                                        !isSelected && selectedIds.length >= maxSelections;
                                    return (
                                        <CommandItem
                                            key={subject.id}
                                            value={subject.id}
                                            onSelect={() => handleSelect(subject.id)}
                                            disabled={isDisabled}
                                            className={cn(
                                                "flex items-center gap-3 cursor-pointer",
                                                isDisabled && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-5 h-5 rounded border flex items-center justify-center shrink-0",
                                                    isSelected
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-muted-foreground/30"
                                                )}
                                            >
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate font-medium">{subject.name}</p>
                                                {subject.code && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {subject.code}
                                                    </p>
                                                )}
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Selected subjects badges */}
            {selectedSubjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map((subject) => (
                        <Badge
                            key={subject.id}
                            variant="secondary"
                            className="flex items-center gap-1 py-1 px-2"
                        >
                            <span className="truncate max-w-[150px]">{subject.name}</span>
                            <button
                                type="button"
                                onClick={(e) => handleRemove(subject.id, e)}
                                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                                aria-label={`Remove ${subject.name}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
