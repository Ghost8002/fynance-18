-- Criar bucket público para logos de bancos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bank-logos',
  'bank-logos',
  true,
  1048576, -- 1MB limit
  ARRAY['image/svg+xml', 'image/png', 'image/jpeg']
);

-- Política para permitir leitura pública
CREATE POLICY "Public Access to Bank Logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'bank-logos');

-- Política para permitir upload apenas para usuários autenticados (admin)
CREATE POLICY "Authenticated users can upload bank logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bank-logos');