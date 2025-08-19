# Integração entre Cartões e Dívidas a Pagar

## Visão Geral

Esta integração permite que as dívidas de cartão de crédito (faturas e parcelamentos) sejam visíveis e gerenciadas na seção de "Dívidas a Pagar", proporcionando uma visão unificada de todas as obrigações financeiras.

## Funcionalidades Implementadas

### 1. **Campos de Integração na Tabela `debts`**

Foram adicionados os seguintes campos à tabela `debts`:

- `card_id`: Referência ao cartão relacionado
- `is_card_bill`: Indica se a dívida representa uma fatura de cartão
- `bill_month`: Mês da fatura (1-12)
- `bill_year`: Ano da fatura
- `installment_id`: Referência ao parcelamento
- `installment_number`: Número da parcela

### 2. **Funções de Banco de Dados**

#### `create_debt_from_card_bill(p_card_id, p_bill_month, p_bill_year)`
- Cria automaticamente uma dívida a partir de uma fatura de cartão
- Evita duplicatas verificando se já existe uma dívida para a mesma fatura

#### `create_debts_from_installments(p_installment_id)`
- Cria dívidas para cada parcela de um parcelamento
- Gera uma dívida separada para cada parcela pendente

#### `sync_debt_payment(p_debt_id, p_payment_amount, p_payment_date)`
- Sincroniza pagamentos de dívidas com faturas/parcelas correspondentes
- Atualiza automaticamente o status das faturas e parcelas

### 3. **Componentes Criados**

#### `CardDebtsSection`
- Mostra faturas pendentes de cartão
- Mostra parcelamentos ativos
- Permite criar dívidas a partir de faturas/parcelamentos
- Botão de sincronização automática

#### `useCardDebtsIntegration` (Hook)
- Gerencia a integração entre cartões e dívidas
- Funções para criar e sincronizar dívidas
- Estados de carregamento e dados

### 4. **Modificações nos Componentes Existentes**

#### `DebtList`
- Adicionada coluna "Cartão" na tabela
- Mostra informações do cartão relacionado
- Indica se é fatura ou parcela

#### `DebtForm`
- Campos opcionais para integração com cartão
- Seleção de cartão relacionado
- Opções para marcar como fatura ou parcela

## Como Aplicar a Migração

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# Se você tem o Supabase CLI configurado
npx supabase db push

# Ou se estiver usando um projeto remoto
npx supabase db push --project-ref YOUR_PROJECT_REF
```

### Opção 2: Manualmente no Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá para a seção "SQL Editor"
3. Execute o seguinte SQL:

```sql
-- Adicionar campos para integração com cartões na tabela debts
ALTER TABLE public.debts 
ADD COLUMN IF NOT EXISTS card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_card_bill BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bill_month INTEGER,
ADD COLUMN IF NOT EXISTS bill_year INTEGER,
ADD COLUMN IF NOT EXISTS installment_id UUID REFERENCES public.card_installments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS installment_number INTEGER;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_debts_card_id ON public.debts(card_id);
CREATE INDEX IF NOT EXISTS idx_debts_is_card_bill ON public.debts(is_card_bill);
CREATE INDEX IF NOT EXISTS idx_debts_installment_id ON public.debts(installment_id);

-- Adicionar comentários para clareza
COMMENT ON COLUMN public.debts.card_id IS 'Referência ao cartão quando a dívida é relacionada a cartão de crédito';
COMMENT ON COLUMN public.debts.is_card_bill IS 'Indica se a dívida representa uma fatura de cartão';
COMMENT ON COLUMN public.debts.bill_month IS 'Mês da fatura (1-12) quando is_card_bill = true';
COMMENT ON COLUMN public.debts.bill_year IS 'Ano da fatura quando is_card_bill = true';
COMMENT ON COLUMN public.debts.installment_id IS 'Referência ao parcelamento quando a dívida é uma parcela';
COMMENT ON COLUMN public.debts.installment_number IS 'Número da parcela quando installment_id não é nulo';
```

4. Execute as funções SQL (veja o arquivo `supabase/migrations/20250101000000-add-card-integration-to-debts.sql`)

## Como Usar a Integração

### 1. **Visualizar Dívidas de Cartão**
- Acesse a seção "Dívidas a Pagar"
- A nova seção "Dívidas de Cartão" aparecerá automaticamente
- Mostra faturas pendentes e parcelamentos ativos

### 2. **Criar Dívidas a Partir de Faturas**
- Na seção "Dívidas de Cartão", clique em "Criar Dívida" ao lado de uma fatura
- A dívida será criada automaticamente com as informações da fatura
- Aparecerá na lista principal de dívidas

### 3. **Criar Dívidas a Partir de Parcelamentos**
- Clique em "Criar Dívidas" ao lado de um parcelamento
- Serão criadas dívidas separadas para cada parcela pendente
- Cada parcela aparecerá como uma dívida individual

### 4. **Sincronização Automática**
- Use o botão "Sincronizar" para criar automaticamente todas as dívidas pendentes
- Útil para sincronizar faturas e parcelamentos existentes

### 5. **Editar Dívidas com Integração**
- Ao editar uma dívida, você pode associá-la a um cartão
- Marcar como fatura ou parcela de cartão
- Definir período da fatura ou número da parcela

## Benefícios da Integração

1. **Visão Unificada**: Todas as obrigações financeiras em um só lugar
2. **Controle de Fluxo de Caixa**: Previsão mais precisa de saídas
3. **Automação**: Criação automática de dívidas a partir de faturas/parcelamentos
4. **Sincronização**: Pagamentos sincronizados automaticamente
5. **Rastreabilidade**: Identificação clara da origem de cada dívida

## Considerações Técnicas

### Performance
- Índices criados para otimizar consultas por cartão
- Consultas eficientes para faturas e parcelamentos

### Segurança
- RLS (Row Level Security) mantido para todos os dados
- Validações de propriedade dos cartões

### Compatibilidade
- Não quebra funcionalidades existentes
- Campos opcionais para integração
- Dívidas sem cartão continuam funcionando normalmente

## Próximos Passos

1. **Aplicar a migração** no banco de dados
2. **Testar a integração** com dados reais
3. **Configurar sincronização automática** se necessário
4. **Monitorar performance** das consultas
5. **Coletar feedback** dos usuários

## Suporte

Para dúvidas ou problemas com a integração:
1. Verifique se a migração foi aplicada corretamente
2. Confirme se as tabelas `card_bills` e `card_installments` existem
3. Verifique os logs do console para erros
4. Teste com dados de exemplo primeiro
