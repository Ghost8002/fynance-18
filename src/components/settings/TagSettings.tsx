
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Plus, Edit2, Check, X } from "lucide-react";

const TagSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: tags, loading, insert, update, remove } = useSupabaseData('tags', user?.id);
  
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !user?.id) return;

    const { error } = await insert({
      user_id: user.id,
      name: newTagName.trim(),
      color: newTagColor,
      is_active: true
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a tag.",
        variant: "destructive",
      });
    } else {
      setNewTagName('');
      setNewTagColor('#3B82F6');
      toast({
        title: "Sucesso",
        description: "Tag criada com sucesso.",
      });
    }
  };

  const handleEditTag = (tag: any) => {
    setEditingTag(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingTag) return;

    const { error } = await update(editingTag, {
      name: editName.trim(),
      color: editColor
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tag.",
        variant: "destructive",
      });
    } else {
      setEditingTag(null);
      setEditName('');
      setEditColor('');
      toast({
        title: "Sucesso",
        description: "Tag atualizada com sucesso.",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditName('');
    setEditColor('');
  };

  const handleDeleteTag = async (tagId: string) => {
    const { error } = await remove(tagId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a tag.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Tag excluída com sucesso.",
      });
    }
  };

  const handleToggleTagActive = async (tagId: string, isActive: boolean) => {
    const { error } = await update(tagId, { is_active: !isActive });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da tag.",
        variant: "destructive",
      });
    }
  };

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Tags</CardTitle>
          <CardDescription>
            Gerencie suas tags para organizar melhor suas transações
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criar Nova Tag</CardTitle>
          <CardDescription>
            Adicione uma nova tag para organizar suas transações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nome da Tag</Label>
              <Input
                id="tag-name"
                placeholder="Ex: Trabalho, Pessoal, Urgente..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-color">Cor</Label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      newTagColor === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Tag
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags Existentes</CardTitle>
          <CardDescription>
            Gerencie suas tags existentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando tags...</p>
          ) : tags.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma tag criada ainda.</p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                  {editingTag === tag.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1"
                      />
                      <div className="flex gap-1">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-6 h-6 rounded-full border ${
                              editColor === color ? 'border-gray-900' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditColor(color)}
                          />
                        ))}
                      </div>
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          style={{ 
                            backgroundColor: tag.color + '20',
                            color: tag.color,
                            borderColor: tag.color
                          }}
                        >
                          {tag.name}
                        </Badge>
                        <Switch
                          checked={tag.is_active}
                          onCheckedChange={() => handleToggleTagActive(tag.id, tag.is_active)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTag(tag)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTag(tag.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TagSettings;
