# 🗄️ ALTERAÇÕES NECESSÁRIAS NO BANCO DE DADOS

## 📋 **RESUMO DAS ALTERAÇÕES**

Após a duplicação da aba de contas a receber, foram implementadas as seguintes alterações no banco de dados para garantir funcionalidade completa e consistência.

---

## ✅ **ALTERAÇÕES IMPLEMENTADAS**

### **1. ESTRUTURA DA TABELA `receivable_payments`**

#### **🔧 Novas Colunas Adicionadas:**

```sql
-- Colunas adicionadas para funcionalidade completa
ALTER TABLE public.receivable_payments 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS received_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

#### **🔧 Constraints de Validação:**

```sql
-- Consistência de recorrência
ALTER TABLE public.receivable_payments 
ADD CONSTRAINT check_receivable_recurrence_consistency 
CHECK (
  (is_recurring = FALSE AND recurrence_type IS NULL) OR 
  (is_recurring = TRUE AND recurrence_type IS NOT NULL)
);

-- Status válidos
ALTER TABLE public.receivable_payments 
ADD CONSTRAINT check_receivable_status 
CHECK (status IN ('pending', 'received', 'overdue'));
```

### **2. FUNÇÕES DE ROLLBACK IMPLEMENTADAS**

#### **🔧 Função para Marcar como Recebido:**

```sql
CREATE OR REPLACE FUNCTION mark_receivable_as_received_with_rollback(
  p_payment_id UUID,
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_account_id UUID,
  p_category_id UUID,
  p_is_recurring BOOLEAN,
  p_recurrence_type TEXT,
  p_due_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
```

**Funcionalidades:**
- ✅ Cria transação de receita automaticamente
- ✅ Atualiza saldo da conta
- ✅ Gerencia recorrências
- ✅ Rollback automático em caso de erro
- ✅ Validações de segurança

#### **🔧 Função para Desmarcar como Recebido:**

```sql
CREATE OR REPLACE FUNCTION unmark_receivable_as_received_with_rollback(
  p_payment_id UUID,
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_account_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
```

**Funcionalidades:**
- ✅ Remove transação associada
- ✅ Reverte saldo da conta
- ✅ Rollback automático em caso de erro
- ✅ Validações de segurança

### **3. ÍNDICES DE PERFORMANCE**

#### **🔧 Índices Adicionados:**

```sql
-- Índices para receivable_payments
CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_status ON public.receivable_payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_due_date ON public.receivable_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_user_due_date ON public.receivable_payments(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_account_id ON public.receivable_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_category_id ON public.receivable_payments(category_id);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_received_date ON public.receivable_payments(received_date);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_is_recurring ON public.receivable_payments(is_recurring);
```

### **4. SEGURANÇA (RLS)**

#### **🔧 Políticas de Segurança:**

```sql
-- Políticas RLS para receivable_payments
CREATE POLICY "Users can view own receivable payments" ON public.receivable_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receivable payments" ON public.receivable_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receivable payments" ON public.receivable_payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own receivable payments" ON public.receivable_payments
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 🚀 **COMO APLICAR AS ALTERAÇÕES**

### **Opção 1: Via Supabase CLI (Recomendado)**

```bash
# 1. Fazer pull das alterações
supabase db pull

# 2. Aplicar as migrações
supabase db push

# 3. Verificar se tudo foi aplicado
supabase db diff
```

### **Opção 2: Via Supabase Dashboard**

1. **Acessar o Supabase Dashboard**
2. **Ir para SQL Editor**
3. **Executar as migrações manualmente:**
   - `20250715022310-3ce28b84-5ee6-47b5-ad42-f22097c0390c.sql`
   - `20250715030000-update-receivable-payments-structure.sql`

### **Opção 3: Via Migration Files**

```bash
# Executar as migrações na ordem correta
supabase migration up
```

---

## 📊 **COMPARAÇÃO: ANTES vs DEPOIS**

### **ANTES (Estrutura Básica):**

```sql
CREATE TABLE receivable_payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT
);
```

### **DEPOIS (Estrutura Completa):**

```sql
CREATE TABLE receivable_payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  account_id UUID REFERENCES public.accounts(id),
  category_id UUID REFERENCES public.categories(id),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_type TEXT,
  received_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_receivable_recurrence_consistency CHECK (...),
  CONSTRAINT check_receivable_status CHECK (...)
);
```

---

## 🔍 **VERIFICAÇÕES PÓS-IMPLANTAÇÃO**

### **1. Verificar Estrutura da Tabela:**

```sql
-- Verificar se todas as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'receivable_payments';
```

### **2. Verificar Funções:**

```sql
-- Verificar se as funções foram criadas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%receivable%';
```

### **3. Verificar Índices:**

```sql
-- Verificar se os índices foram criados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'receivable_payments';
```

### **4. Verificar Políticas RLS:**

```sql
-- Verificar políticas de segurança
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'receivable_payments';
```

---

## ⚠️ **IMPORTANTE: BACKUP ANTES DE APLICAR**

### **Recomendação de Segurança:**

```bash
# 1. Fazer backup antes das alterações
supabase db dump --data-only > backup_before_changes.sql

# 2. Aplicar as alterações
supabase db push

# 3. Testar funcionalidade
# 4. Se necessário, restaurar backup
supabase db reset
psql -f backup_before_changes.sql
```

---

## 🎯 **RESULTADO ESPERADO**

Após aplicar todas as alterações:

1. **✅ Tabela `receivable_payments`** com estrutura completa
2. **✅ Funções de rollback** funcionando corretamente
3. **✅ Índices de performance** otimizados
4. **✅ Segurança RLS** implementada
5. **✅ Interface duplicada** funcionando perfeitamente
6. **✅ Consistência** entre dívidas e receitas

**Status:** Pronto para produção com funcionalidade completa e robusta. 