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
import { Tag, useTags } from "@/hooks/useTags";

// Interface para suportar ambos os modos: com Tag objects ou com string IDs
interface TagSelectorProps {
  // New interface (with Tag objects)
  value?: Tag[];
  onChange?: (tags: Tag[]) => void;
  allTags?: Tag[];
  onTagCreated?: () => void;
  
  // Old interface (with string IDs) - mantido para compatibilidade
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  
  // Common props
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

export function TagSelector(props: TagSelectorProps) {
  const {
    // New interface props
    value: valueFromProps,
    onChange: onChangeFromProps,
    allTags: allTagsFromProps,
    onTagCreated: onTagCreatedFromProps,
    // Old interface props
    selectedTags,
    onTagsChange,
    // Common props
    placeholder = "Selecionar tags...",
    className,
  } = props;

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Buscar tags se não foram fornecidas (modo antigo)
  const { tags: fetchedTags, fetchTags } = useTags();
  
  // Determinar qual modo estamos usando
  const isNewMode = valueFromProps !== undefined && onChangeFromProps !== undefined;
  const allTags = isNewMode ? (allTagsFromProps || []) : fetchedTags;
  const activeTags = allTags.filter(tag => tag.is_active);
  
  // Converter entre formatos
  const selectedTagObjects: Tag[] = isNewMode 
    ? valueFromProps 
    : activeTags.filter(tag => selectedTags?.includes(tag.id));
  
  const selectedTagIds = selectedTagObjects.map(t => t.id);

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

      if (isNewMode) {
        const newTags = [...selectedTagObjects, data];
        onChangeFromProps(newTags);
        onTagCreatedFromProps?.();
      } else {
        const newTagIds = [...(selectedTags || []), data.id];
        onTagsChange?.(newTagIds);
        fetchTags();
      }
      
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
    
    if (isNewMode) {
      if (isSelected) {
        onChangeFromProps(selectedTagObjects.filter(t => t.id !== tag.id));
      } else {
        onChangeFromProps([...selectedTagObjects, tag]);
      }
    } else {
      if (isSelected) {
        onTagsChange?.((selectedTags || []).filter(id => id !== tag.id));
      } else {
        onTagsChange?.([...(selectedTags || []), tag.id]);
      }
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
          {selectedTagObjects.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedTagObjects.map(tag => (
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
