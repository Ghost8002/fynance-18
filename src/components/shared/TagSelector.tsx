import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tag } from "@/hooks/useTags";

interface TagSelectorProps {
  value: Tag[];
  onChange: (tags: Tag[]) => void;
  allTags: Tag[];
  onTagCreated?: () => void;
  placeholder?: string;
  className?: string;
}

const getRandomColor = () => {
  const colors = [
    "#EF4444", "#F59E0B", "#10B981", "#3B82F6", 
    "#6366F1", "#8B5CF6", "#EC4899", "#14B8A6"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export function TagSelector({
  value,
  onChange,
  allTags,
  onTagCreated,
  placeholder = "Selecionar tags...",
  className,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const activeTags = allTags.filter(tag => tag.is_active);
  const selectedTagIds = value.map(t => t.id);

  const handleCreateTag = async (name: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({
          user_id: user.id,
          name: name.trim(),
          color: getRandomColor(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const newTags = [...value, data];
      onChange(newTags);
      onTagCreated?.();
      setSearchQuery("");
      
      toast({
        title: "Sucesso",
        description: "Tag criada com sucesso!",
      });
    } catch (error) {
      console.error("Error creating tag:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a tag.",
        variant: "destructive",
      });
    }
  };

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTagIds.includes(tag.id);
    if (isSelected) {
      onChange(value.filter(t => t.id !== tag.id));
    } else {
      onChange([...value, tag]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      const existingTag = activeTags.find(
        t => t.name.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      
      if (existingTag) {
        toggleTag(existingTag);
        setSearchQuery("");
      } else {
        handleCreateTag(searchQuery);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: tag.color,
                    color: tag.color
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar ou criar tag..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-2">
                <p className="text-sm text-muted-foreground">
                  Nenhuma tag encontrada
                </p>
                {searchQuery.trim() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreateTag(searchQuery)}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Criar "{searchQuery}"
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {activeTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => toggleTag(tag)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        borderColor: tag.color,
                        color: tag.color
                      }}
                    >
                      {tag.name}
                    </Badge>
                  </CommandItem>
                );
              })}
              {searchQuery.trim() && 
               !activeTags.some(t => t.name.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                <CommandItem
                  value={searchQuery}
                  onSelect={() => handleCreateTag(searchQuery)}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Criar "{searchQuery}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
