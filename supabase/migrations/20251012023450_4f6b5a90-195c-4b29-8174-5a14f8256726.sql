-- Função para remover tag de todas as transações
CREATE OR REPLACE FUNCTION remove_tag_from_transactions(p_tag_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove a tag do campo JSONB tags em todas as transações
  UPDATE public.transactions
  SET tags = (
    SELECT jsonb_agg(tag)
    FROM jsonb_array_elements(tags) AS tag
    WHERE (tag->>'id')::uuid != p_tag_id
  )
  WHERE tags @> jsonb_build_array(jsonb_build_object('id', p_tag_id));
END;
$$;

-- Trigger para limpar tags das transações quando uma tag é deletada
CREATE OR REPLACE FUNCTION cleanup_deleted_tag()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remove a tag de todas as transações antes de deletá-la
  PERFORM remove_tag_from_transactions(OLD.id);
  RETURN OLD;
END;
$$;

-- Criar trigger que executa antes de deletar uma tag
DROP TRIGGER IF EXISTS before_delete_tag ON public.tags;
CREATE TRIGGER before_delete_tag
  BEFORE DELETE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_deleted_tag();