# Correção Abrangente de Problemas de Timezone em Datas

## 🐛 Problema Identificado

**Sintoma:** Todas as transações criadas no sistema estavam sendo registradas com um dia anterior à data correta.

**Exemplo:**
- Data inserida: `01/10/2025`
- Data registrada: `30/09/2025`

## 🔍 Causa Raiz

O problema ocorria devido ao uso inconsistente de `new Date().toISOString().split('T')[0]` em múltiplos pontos do sistema:

1. **JavaScript Date Constructor**: `new Date('2025-10-01')` é interpretado como UTC
2. **Timezone Brasil**: UTC-3 faz com que `2025-10-01 00:00:00 UTC` vire `2025-09-30 21:00:00` local
3. **Deslocamento**: Resultado final é `30/09/2025` em vez de `01/10/2025`

## ✅ Solução Implementada

### 1. Funções Utilitárias Centralizadas

Criadas em `src/utils/dateValidation.ts`:

```typescript
/**
 * Obtém a data atual no timezone local em formato YYYY-MM-DD
 * Substitui new Date().toISOString().split('T')[0] para evitar problemas de timezone
 */
export const getCurrentLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converte um objeto Date para string no formato YYYY-MM-DD no timezone local
 * Evita problemas de timezone ao usar toISOString()
 */
export const dateToLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
```

### 2. Pontos Corrigidos

#### **Formulários de Transação**
- `src/components/shared/TransactionForm.tsx`
- Substituído: `new Date().toISOString().split('T')[0]`
- Por: `getCurrentLocalDateString()`

#### **Transferências entre Contas**
- `src/components/accounts/AccountTransfer.tsx`
- Corrigido uso de data atual em transações de transferência

#### **Formulários de Recebíveis**
- `src/components/receivables/forms/useReceivableFormSubmit.ts`
- Substituído: `formData.due_date.toISOString().split('T')[0]`
- Por: `dateToLocalDateString(formData.due_date)`

#### **Ações do Calendário**
- `src/hooks/useCalendarActions.ts`
- Corrigido datas de recebimento e pagamento

#### **Integração com Cartões**
- `src/hooks/useCardDebtsIntegration.ts`
- Corrigido datas de pagamento de dívidas

#### **Compras Parceladas**
- `src/components/cards/InstallmentPurchaseForm.tsx`
- Substituído: `installmentDate.toISOString().split('T')[0]`
- Por: `dateToLocalDateString(installmentDate)`

#### **Formulários de Orçamento**
- `src/components/budgets/BudgetForm.tsx`
- Corrigido datas de início e fim de orçamentos

### 3. Testes Automatizados

Criado `src/utils/__tests__/dateValidation.test.ts` com:
- Testes unitários para todas as funções
- Validação de comportamento correto
- Comparação com comportamento problemático anterior
- Testes de edge cases

## 🔧 Como Funciona a Correção

### **Antes (Problemático):**
```typescript
// Criava data em UTC, causando deslocamento no Brasil
const date = new Date().toISOString().split('T')[0];
// Resultado: "2025-09-30" para data local "01/10/2025"
```

### **Depois (Corrigido):**
```typescript
// Usa componentes de data local, evitando conversão UTC
const date = getCurrentLocalDateString();
// Resultado: "2025-10-01" para data local "01/10/2025"
```

## 📋 Validações Implementadas

### **1. Testes Unitários**
- Validação de formato de data (YYYY-MM-DD)
- Testes de conversão de componentes
- Verificação de comportamento em diferentes timezones

### **2. Validações de Entrada**
- Formato OFX (YYYYMMDD)
- Datas de Excel (números seriais)
- Formatos brasileiros (DD/MM/YYYY)

### **3. Prevenção de Regressões**
- Funções centralizadas evitam duplicação de código
- Testes automatizados detectam problemas futuros
- Documentação clara para desenvolvedores

## 🚀 Benefícios da Solução

1. **Correção Imediata**: Todas as novas transações usam datas corretas
2. **Consistência**: Mesmo comportamento em todas as formas de entrada
3. **Manutenibilidade**: Funções centralizadas facilitam futuras correções
4. **Testabilidade**: Cobertura de testes evita regressões
5. **Performance**: Solução eficiente sem overhead significativo

## 📝 Instruções para Desenvolvedores

### **Para Novos Desenvolvimentos:**
```typescript
// ✅ CORRETO - Use as funções utilitárias
import { getCurrentLocalDateString, dateToLocalDateString } from '@/utils/dateValidation';

// Data atual
const today = getCurrentLocalDateString();

// Data específica
const specificDate = dateToLocalDateString(new Date(2025, 9, 1));
```

### **❌ EVITE:**
```typescript
// PROBLEMÁTICO - Pode causar deslocamento de timezone
const date = new Date().toISOString().split('T')[0];
const date2 = someDate.toISOString().split('T')[0];
```

## 🔄 Migração de Dados Existentes

**Nota:** Esta correção afeta apenas novas transações. Para dados existentes com datas incorretas, seria necessário um script de migração específico, que deve ser executado com cuidado e backup prévio.

## ✅ Status da Implementação

- [x] Funções utilitárias criadas
- [x] Formulários de transação corrigidos
- [x] Transferências corrigidas
- [x] Recebíveis corrigidos
- [x] Ações do calendário corrigidas
- [x] Integração com cartões corrigida
- [x] Compras parceladas corrigidas
- [x] Orçamentos corrigidos
- [x] Testes automatizados criados
- [x] Documentação atualizada

**Data da Implementação:** Janeiro 2025
**Versão:** 1.0
**Status:** ✅ Implementado e Testado
