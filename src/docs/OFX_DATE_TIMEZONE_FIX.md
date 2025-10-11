# Correção do Problema de Timezone em Importações OFX e XLSX

## 🐛 Problema Identificado

Durante a importação de arquivos OFX e XLSX, as transações estavam sendo cadastradas com datas incorretas devido a problemas de timezone:

- **Data original no OFX/XLSX**: 01/10/2025
- **Data cadastrada no sistema**: 30/09/2025 (deslocamento de 1 dia)

## 🔍 Causa Raiz

O problema ocorria porque:

1. **JavaScript Date Constructor**: Quando criamos `new Date('2025-10-01')`, o JavaScript interpreta como UTC
2. **Timezone Brasil**: O Brasil está em UTC-3, então `2025-10-01 00:00:00 UTC` vira `2025-09-30 21:00:00` local
3. **Deslocamento de Data**: Isso faz com que a data seja exibida como 30/09/2025 em vez de 01/10/2025

### Exemplo do Problema:
```typescript
// PROBLEMA: new Date('2025-10-01') → interpretado como UTC
const problematicDate = new Date('2025-10-01');
console.log(problematicDate.toLocaleDateString('pt-BR')); // "30/09/2025" ❌

// SOLUÇÃO: new Date('2025-10-01T00:00:00') → interpretado como local
const correctDate = new Date('2025-10-01T00:00:00');
console.log(correctDate.toLocaleDateString('pt-BR')); // "01/10/2025" ✅
```

## ✅ Solução Implementada

### 1. Função Genérica para Conversão de Datas

Criada função genérica em `src/utils/dateValidation.ts` para resolver problemas de timezone:

```typescript
// Função específica para OFX
export const convertOFXDate = (dateStr: string): string => {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return convertToLocalDateString(year, month, day);
};

// Função genérica para todas as importações
export const convertToLocalDateString = (year: string, month: string, day: string): string => {
  // Criar data no timezone local especificando horário para evitar interpretação UTC
  const localDate = new Date(`${year}-${month}-${day}T00:00:00`);
  return localDate.toISOString().split('T')[0];
};
```

### 2. Validação de Datas OFX

```typescript
export const isValidOFXDate = (dateStr: string): boolean => {
  if (!dateStr || dateStr.length < 8) return false;
  
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  
  // Validações básicas
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Validar se a data é válida
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
};
```

### 3. Atualização dos Processadores

#### Web Worker (`src/workers/importWorker.ts`):
```typescript
// Converter data OFX usando função utilitária com correção de timezone
let date: string;
try {
  if (isValidOFXDate(dateStr)) {
    date = convertOFXDate(dateStr);
  } else {
    console.warn(`Data OFX inválida: ${dateStr}, usando fallback`);
    date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
} catch (error) {
  console.warn(`Erro ao converter data OFX: ${dateStr}, usando fallback`, error);
  date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
}
```

#### Hook OFX Import (`src/hooks/useOFXImport.ts`):
```typescript
// Mesma lógica aplicada no processamento síncrono
let date: string;
try {
  if (isValidOFXDate(dateStr)) {
    date = convertOFXDate(dateStr);
  } else {
    console.warn(`Data OFX inválida: ${dateStr}, usando fallback`);
    date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
} catch (error) {
  console.warn(`Erro ao converter data OFX: ${dateStr}, usando fallback`, error);
  date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
}
```

#### Importadores XLSX (`src/components/shared/SimpleXLSXImporter.tsx` e `XLSXImporter.tsx`):
```typescript
// Usar função genérica para conversão de datas
if (parts[0].length === 4) {
  // YYYY/MM/DD - usar função genérica para evitar problemas de timezone
  formattedDate = convertToLocalDateString(parts[0], parts[1], parts[2]);
} else {
  // DD/MM/YYYY - usar função genérica para evitar problemas de timezone
  formattedDate = convertToLocalDateString(parts[2], parts[1], parts[0]);
}
```

## 🧪 Teste da Correção

### Cenário de Teste:
1. **Arquivo OFX** com transação em 01/10/2025
2. **Arquivo XLSX** com transação em 01/10/2025
3. **Resultado esperado**: Transação cadastrada em 01/10/2025
4. **Resultado anterior**: Transação cadastrada em 30/09/2025

### Como Testar:
1. Importe um arquivo OFX com transações de 01/10/2025
2. Importe um arquivo XLSX com transações de 01/10/2025
3. Verifique se as datas são cadastradas corretamente
4. Confirme que não há mais deslocamento de dias

## 📊 Logs de Debug

### Antes da Correção:
```
Data OFX: 20251001 → new Date('2025-10-01') → UTC → 2025-09-30 ❌
Data XLSX: 01/10/2025 → new Date('2025-10-01') → UTC → 2025-09-30 ❌
```

### Depois da Correção:
```
Data OFX: 20251001 → new Date('2025-10-01T00:00:00') → Local → 2025-10-01 ✅
Data XLSX: 01/10/2025 → new Date('2025-10-01T00:00:00') → Local → 2025-10-01 ✅
```

## 🔧 Características da Solução

### ✅ Vantagens:
- **Correção de timezone**: Resolve deslocamento de datas
- **Validação robusta**: Verifica se a data OFX é válida
- **Fallback seguro**: Mantém funcionalidade em caso de erro
- **Logs detalhados**: Facilita debug e monitoramento
- **Reutilização**: Função centralizada para todos os processadores

### 🛡️ Segurança:
- **Tratamento de erros**: Não quebra o sistema em caso de data inválida
- **Validação**: Verifica formato e validade da data
- **Fallback**: Mantém funcionalidade básica se a conversão falhar

## 🚀 Resultado

✅ **Problema resolvido**: Datas OFX e XLSX agora são importadas corretamente  
✅ **Timezone brasileiro**: Ajuste automático para timezone local  
✅ **Função genérica**: Solução reutilizável para todas as importações  
✅ **Robustez**: Tratamento de erros implementado  
✅ **Debug**: Logs detalhados para monitoramento  
✅ **Compatibilidade**: Mantém suporte a formatos existentes  

## 📝 Notas Importantes

- **Timezone local**: Solução usa timezone local do navegador (Brasil)
- **Performance**: Conversão rápida e eficiente
- **Compatibilidade**: Funciona com arquivos OFX 1.x e 2.x e XLSX
- **Manutenção**: Código centralizado facilita futuras atualizações
- **Escalabilidade**: Função genérica pode ser usada em outras partes do sistema
