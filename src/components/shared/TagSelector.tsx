
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
  isMobile?: boolean;
}

const TagSelector = ({ selectedTags, onTagsChange, isMobile = false }: TagSelectorProps) => {
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
      const { getRandomColor } = await import('@/utils/colorGenerator');
      const randomColor = getRandomColor();
      const { data, error } = await supabase
        .from("tags")
        .insert([{ user_id: user.id, name: trimmed, color: randomColor, is_active: true }])
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

  // Se não há tags, ainda permitir criação dinâmica
  // Removido o bloqueio que impedia a criação de tags quando não há tags existentes

  return (
    <div className={`${isMobile ? 'space-y-1 sm:space-y-1.5' : 'space-y-2'}`}>
      <Label className={`${isMobile ? 'text-xs' : ''}`}>Tags</Label>
      
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className={`flex flex-wrap gap-1 mb-2 ${isMobile ? 'gap-0.5 sm:gap-1' : ''}`}>
          {getSelectedTagsInfo().map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className={`flex items-center gap-1 ${isMobile ? 'text-xs px-2 py-0.5' : ''}`}
              style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
            >
              <div
                className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full`}
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              <X
                className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} cursor-pointer hover:text-destructive`}
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
            className={`w-full justify-between ${isMobile ? 'h-8 text-xs' : ''}`}
            onClick={() => {
              console.log('Opening tag selector, available tags:', activeTags.length);
              setOpen(true);
            }}
          >
            <div className="flex items-center gap-2">
              <Tag className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : ''}`}>
                {selectedTags.length > 0
                  ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selecionada${selectedTags.length > 1 ? 's' : ''}`
                  : "Selecionar tags"
                }
              </span>
            </div>
            <Plus className={`ml-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'} shrink-0 opacity-50`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`${isMobile ? 'w-72 max-h-48' : 'w-80'} p-0`} align="start" side="bottom">
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
              className={`${isMobile ? 'h-8 text-xs' : ''}`}
            />
            <CommandList className={`${isMobile ? 'max-h-32' : ''}`}>
              <CommandEmpty className={`${isMobile ? 'text-xs py-2' : ''}`}>Nenhuma tag encontrada.</CommandEmpty>

              {tagQuery.trim() &&
                !activeTags.some(
                  (t) => t.name.toLowerCase() === tagQuery.trim().toLowerCase()
                ) && (
                <CommandGroup>
                  <CommandItem
                    value={`__create_${tagQuery}`}
                    onSelect={() => handleCreateTag(tagQuery)}
                    className={`cursor-pointer ${isMobile ? 'text-xs py-1.5' : ''}`}
                  >
                    Criar "{tagQuery.trim()}"
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
                      className={`cursor-pointer ${isMobile ? 'text-xs py-1.5' : ''}`}
                    >
                      <Check
                        className={cn(
                          `mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`,
                          selectedTags.includes(tag.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`}
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
