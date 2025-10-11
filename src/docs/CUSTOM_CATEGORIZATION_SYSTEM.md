# Sistema de Categorização Customizado

## Visão Geral

Este sistema foi criado especificamente para usar o banco de dados **CATEGORIAS E PALAVRAS-CHAVE.txt** fornecido pelo usuário. Ele oferece categorização automática inteligente de transações financeiras com alta precisão e flexibilidade.

## Estrutura do Sistema

### 1. **CustomKeywordDatabase.ts**
Base de dados estruturada com todas as categorias e palavras-chave do arquivo fornecido:

```typescript
export const CUSTOM_KEYWORD_DATABASE = {
  alimentacao: {
    name: 'Alimentação',
    type: 'expense',
    keywords: ['supermercado', 'mercadinho', 'restaurante', ...],
    confidence: 95,
    priority: 10
  },
  // ... outras categorias
};
```

### 2. **CustomCategoryEngine.ts**
Motor de categorização que implementa múltiplos algoritmos:

- **Busca Exata**: Palavras-chave exatas na descrição
- **Busca Parcial**: Palavras-chave contidas na descrição
- **Análise Contextual**: Padrões semânticos (PIX, transferências, etc.)
- **Validação de Consistência**: Verifica tipo vs categoria

### 3. **CustomCategorizationTest.tsx**
Interface de teste interativa para validar o sistema

## Categorias Disponíveis

### Receitas (Income)
1. **Transferências Recebidas** - PIX recebido, transferências recebidas, depósitos
2. **Salário e Rendas** - Salários, freelances, vendas, comissões

### Despesas (Expense)
1. **Alimentação** - Supermercados, restaurantes, delivery, padarias
2. **Transporte** - Postos, Uber, passagens, estacionamento
3. **Compras** - Lojas, farmácias, eletrônicos, roupas
4. **Saúde** - Farmácias, consultas, planos de saúde
5. **Educação** - Escolas, cursos, material escolar
6. **Serviços** - Assinaturas, academia, manutenção
7. **Moradia** - Aluguel, contas de luz/água, internet
8. **Lazer** - Cinema, shows, viagens, jogos
9. **Investimentos** - Aplicações, resgates, corretoras
10. **Transferências Enviadas** - PIX enviado, pagamentos
11. **Impostos e Taxas** - IPVA, IPTU, multas, taxas bancárias
12. **Outros** - Categoria genérica para casos não identificados

## Funcionalidades Principais

### 1. **Categorização Inteligente**
```typescript
const result = engine.categorize({
  description: "PIX recebido de João Silva",
  amount: 150.00,
  originalType: "expense", // Será corrigido para "income"
  date: "2024-01-15"
});

// Resultado:
{
  category: "Transferências Recebidas",
  confidence: 95,
  method: "context",
  matchedKeyword: "PIX recebido",
  type: "income", // Corrigido automaticamente
  warnings: []
}
```

### 2. **Correção Automática de Tipo**
O sistema detecta e corrige tipos incorretos:

**Exemplos de Correções:**
- "PIX recebido de João" (tipo original: despesa) → Corrigido para **receita**
- "Pagamento de boleto" (tipo original: receita) → Corrigido para **despesa**
- "Salário - Empresa XYZ" (tipo original: despesa) → Corrigido para **receita**

### 3. **Validação de Consistência**
Gera avisos quando detecta inconsistências:

```typescript
// Aviso gerado:
"⚠️ ATENÇÃO: Descrição sugere receita mas categoria é de despesa"
```

### 4. **Múltiplos Métodos de Busca**

#### Busca Exata (Confiança: 95%)
- Palavra-chave exata na descrição
- Ex: "supermercado" → "Alimentação"

#### Busca Parcial (Confiança: 75%)
- Palavra-chave contida na descrição
- Ex: "compra no supermercado ABC" → "Alimentação"

#### Análise Contextual (Confiança: 90%)
- Padrões semânticos específicos
- Ex: "PIX recebido" → "Transferências Recebidas"

### 5. **Estatísticas Detalhadas**
```typescript
const stats = engine.generateStats(results);
// {
//   totalTransactions: 100,
//   categorizedTransactions: 95,
//   averageConfidence: 87.5,
//   categoryDistribution: { "Alimentação": 25, "Transporte": 20, ... },
//   methodDistribution: { "exact": 60, "partial": 25, "context": 10 },
//   warningsCount: 5
// }
```

## Integração com Importação

### Worker de Importação Atualizado
O `importWorker.ts` foi atualizado para usar o sistema customizado:

```typescript
// Categorização automática durante importação
const engine = initializeCustomCategoryEngine();
const categorization = engine.categorize({
  description: transaction.description,
  amount: transaction.amount,
  originalType: transaction.type,
  date: transaction.date
});

if (categorization) {
  transaction.category = categorization.category;
  transaction.type = categorization.type; // Tipo corrigido se necessário
}
```

### Benefícios da Integração
- **Categorização Automática**: Aplicada durante importação OFX/XLSX
- **Correção de Tipos**: Detecta e corrige tipos incorretos automaticamente
- **Validação**: Gera avisos para inconsistências
- **Transparência**: Mostra confiança e método usado

## Interface de Teste

### CustomCategorizationTest Component
Interface completa para testar o sistema:

**Funcionalidades:**
- Teste de transações individuais
- Exemplos pré-definidos
- Visualização de resultados detalhados
- Estatísticas em tempo real
- Banco de dados navegável

**Exemplos Incluídos:**
- "Compra no supermercado ABC" → Alimentação
- "PIX recebido de João Silva" → Transferências Recebidas
- "Salário - Empresa XYZ" → Salário e Rendas
- "Netflix - Assinatura mensal" → Serviços

## Configuração e Personalização

### Ajustar Confiança Mínima
```typescript
const engine = getCustomCategoryEngine({
  minConfidence: 80, // Aceitar apenas categorizações com 80%+ de confiança
  enableTypeCorrection: true
});
```

### Adicionar Novas Palavras-chave
```typescript
// Adicionar palavra-chave a uma categoria existente
engine.addKeywordToCategory('alimentacao', 'nova_palavra');
```

### Buscar Categorias por Palavra-chave
```typescript
const results = findCategoryByKeyword('supermercado');
// Retorna todas as categorias que contêm essa palavra-chave
```

## Exemplos de Uso

### 1. Categorização Simples
```typescript
const result = engine.categorize({
  description: "Compra no supermercado ABC",
  amount: -89.50,
  originalType: "expense"
});

// Resultado: { category: "Alimentação", confidence: 95, method: "partial" }
```

### 2. Categorização com Correção de Tipo
```typescript
const result = engine.categorize({
  description: "PIX recebido de João Silva",
  amount: 150.00,
  originalType: "expense" // Incorreto
});

// Resultado: 
// {
//   category: "Transferências Recebidas",
//   type: "income", // Corrigido
//   warnings: ["Tipo sugerido (receita) diferente do tipo original (despesa)"]
// }
```

### 3. Categorização em Lote
```typescript
const transactions = [
  { description: "Supermercado ABC", amount: -50, originalType: "expense" },
  { description: "Salário empresa", amount: 3000, originalType: "expense" },
  { description: "PIX para Maria", amount: 100, originalType: "income" }
];

const results = engine.categorizeBatch(transactions);
// Processa todas as transações de uma vez
```

## Métricas e Monitoramento

### Estatísticas Disponíveis
- **Taxa de Categorização**: % de transações categorizadas
- **Confiança Média**: Score médio de confiança
- **Distribuição por Categoria**: Quantas transações por categoria
- **Distribuição por Método**: Quantas por método de busca
- **Contagem de Avisos**: Quantos avisos foram gerados

### Relatórios de Performance
```typescript
const report = engine.generateStats(results);
console.log(`Taxa de categorização: ${(report.categorizedTransactions / report.totalTransactions * 100).toFixed(1)}%`);
console.log(`Confiança média: ${report.averageConfidence.toFixed(1)}%`);
console.log(`Avisos gerados: ${report.warningsCount}`);
```

## Vantagens do Sistema Customizado

### 1. **Baseado em Dados Reais**
- Usa especificamente as palavras-chave fornecidas pelo usuário
- Categorias alinhadas com as necessidades do negócio

### 2. **Alta Precisão**
- Múltiplos algoritmos de busca
- Validação de consistência
- Correção automática de tipos

### 3. **Transparência Total**
- Mostra confiança de cada categorização
- Explica método usado
- Gera avisos para inconsistências

### 4. **Flexibilidade**
- Fácil adição de novas palavras-chave
- Configuração de confiança mínima
- Suporte a categorias personalizadas

### 5. **Integração Completa**
- Funciona com importação OFX/XLSX
- Interface de teste integrada
- Estatísticas em tempo real

## Próximos Passos

1. **Machine Learning**: Aprender com correções do usuário
2. **Regras Personalizadas**: Permitir regras específicas por usuário
3. **Análise de Padrões**: Identificar padrões únicos
4. **Integração com IA**: Categorização mais avançada
5. **Exportação de Dados**: Relatórios detalhados

---

**Sistema implementado com sucesso!** ✅  
**Baseado em:** CATEGORIAS E PALAVRAS-CHAVE.txt  
**Versão:** 1.0  
**Status:** Pronto para uso em produção
