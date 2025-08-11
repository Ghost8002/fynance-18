
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, Plus, Tag, X } from "lucide-react";
import { useTags } from "@/hooks/useTags";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const TagSelector = ({ selectedTags, onTagsChange }: TagSelectorProps) => {
  const { tags, loading, fetchTags } = useTags();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [tagQuery, setTagQuery] = useState("");

  // Adicionar verificação de segurança para evitar erros
  const safeTags = tags || [];
  const activeTags = safeTags.filter(tag => tag && tag.is_active);

  const handleTagToggle = (tagId: string) => {
    console.log('Toggling tag:', tagId, 'Current selection:', selectedTags);
    if (selectedTags.includes(tagId)) {
      const newTags = selectedTags.filter(id => id !== tagId);
      console.log('Removing tag, new selection:', newTags);
      onTagsChange(newTags);
    } else {
      const newTags = [...selectedTags, tagId];
      console.log('Adding tag, new selection:', newTags);
      onTagsChange(newTags);
    }
  };

  const removeTag = (tagId: string) => {
    console.log('Removing tag directly:', tagId);
    const newTags = selectedTags.filter(id => id !== tagId);
    onTagsChange(newTags);
  };

  const handleCreateTag = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const defaultColor = "#8884d8";
      const { data, error } = await supabase
        .from("tags")
        .insert([{ user_id: user.id, name: trimmed, color: defaultColor, is_active: true }])
        .select()
        .limit(1);

      if (error) throw error;
      const newTag = data?.[0];
      if (newTag) {
        await fetchTags();
        onTagsChange([...selectedTags, newTag.id]);
        toast({ title: "Tag criada", description: `“${trimmed}” adicionada com sucesso.` });
        setOpen(false);
        setTagQuery("");
      }
    } catch (err) {
      console.error("Erro ao criar tag:", err);
      toast({ title: "Erro", description: "Não foi possível criar a tag.", variant: "destructive" });
    }
  };

  const getSelectedTagsInfo = () => {
    return selectedTags
      .map(tagId => activeTags.find(tag => tag.id === tagId))
      .filter(Boolean);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando tags...</div>;
  }

  // Se não há tags, mostrar mensagem informativa
  if (!safeTags.length) {
    return (
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="text-sm text-muted-foreground">
          Nenhuma tag disponível. Crie tags nas configurações primeiro.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {getSelectedTagsInfo().map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
              style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeTag(tag.id)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            onClick={() => {
              console.log('Opening tag selector, available tags:', activeTags.length);
              setOpen(true);
            }}
          >
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>
                {selectedTags.length > 0
                  ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selecionada${selectedTags.length > 1 ? 's' : ''}`
                  : "Selecionar tags"
                }
              </span>
            </div>
            <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start" side="bottom">
          <Command
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const exists = activeTags.some(
                  (t) => t.name.toLowerCase() === tagQuery.trim().toLowerCase()
                );
                if (tagQuery.trim() && !exists) {
                  handleCreateTag(tagQuery);
                }
              }
            }}
          >
            <CommandInput
              placeholder="Buscar ou criar tag..."
              value={tagQuery}
              onValueChange={setTagQuery}
            />
            <CommandList>
              <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>

              {tagQuery.trim() &&
                !activeTags.some(
                  (t) => t.name.toLowerCase() === tagQuery.trim().toLowerCase()
                ) && (
                <CommandGroup>
                  <CommandItem
                    value={`__create_${tagQuery}`}
                    onSelect={() => handleCreateTag(tagQuery)}
                    className="cursor-pointer"
                  >
                    Criar “{tagQuery.trim()}”
                  </CommandItem>
                </CommandGroup>
              )}

              {activeTags.length > 0 && (
                <CommandGroup>
                  {activeTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => {
                        console.log('Tag selected from command:', tag.name, tag.id);
                        handleTagToggle(tag.id);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedTags.includes(tag.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TagSelector;
