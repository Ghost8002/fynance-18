# Guia de Importação XLSX - Fynance

## 📋 Visão Geral

A funcionalidade de importação XLSX foi completamente refeita para ser mais simples, objetiva e robusta. O sistema agora segue um fluxo claro e direto para facilitar a vida do usuário.

## 🎯 Fluxo da Funcionalidade

### 1. Upload do Arquivo XLSX
- O usuário seleciona o arquivo localmente (drag & drop ou clique)
- O sistema valida automaticamente se as colunas obrigatórias estão presentes
- Suporte apenas para arquivos `.xlsx` e `.xls`

### 2. Seleção da Conta de Destino
- **OBRIGATÓRIO**: O usuário deve selecionar em qual conta bancária/carteira deseja gravar os lançamentos
- A seleção é obrigatória antes de prosseguir

### 3. Pré-visualização dos Dados
- Exibe uma tabela simples com os dados lidos do XLSX
- Mostra as primeiras 20 linhas para verificação
- Permite que o usuário confirme ou cancele a importação

### 4. Gravação dos Dados
- Para cada linha válida do XLSX:
  - Cria um lançamento na conta selecionada
  - Preenche os campos conforme as colunas do arquivo
  - Ignora linhas vazias ou inválidas
- Atualiza automaticamente o saldo da conta

### 5. Confirmação
- Exibe mensagem de sucesso: "✅ Importação concluída: X lançamentos gravados na conta [NOME DA CONTA]"
- Mostra estatísticas: importados, erros, total

## 📂 Estrutura do Arquivo XLSX

### Colunas Obrigatórias (nesta ordem exata):

1. **Data** – data do lançamento (dd/mm/yyyy ou yyyy-mm-dd)
2. **Descrição** – texto livre
3. **Valor** – número decimal (positivo ou negativo)
4. **Tipo** – receita ou despesa
5. **Categoria** – nome da categoria (opcional)
6. **Tags** – tags separadas por vírgula (opcional)

### Exemplo de Estrutura:

| Data | Descrição | Valor | Tipo | Categoria | Tags |
|------|-----------|-------|------|-----------|------|
| 15/01/2024 | Compra no supermercado | -150.50 | despesa | Alimentação | compras, mercado |
| 16/01/2024 | Salário | 3000.00 | receita | Salário | trabalho, renda |
| 17/01/2024 | Combustível | -80.00 | despesa | Transporte | carro, posto |

## ✅ Critérios de Aceitação

- ✅ O sistema aceita apenas arquivos XLSX válidos e com colunas obrigatórias
- ✅ O usuário deve escolher obrigatoriamente a conta de destino
- ✅ Todos os lançamentos são gravados corretamente com base nas colunas
- ✅ O fluxo é simples: Upload → Selecionar Conta → (Pré-visualizar) → Confirmar → Gravar
- ✅ Em caso de erro (coluna faltando, valor inválido), o sistema informa claramente ao usuário

## 🔧 Funcionalidades Técnicas

### Validação Automática
- Verifica se todas as colunas obrigatórias estão presentes
- Valida formato de datas (suporta DD/MM/YYYY e YYYY-MM-DD)
- Valida valores monetários (remove R$, normaliza vírgulas/pontos)
- Valida tipos (receita/despesa)

### Processamento Inteligente
- Ignora linhas vazias ou com dados inválidos
- Processa tags separadas por vírgula
- Determina automaticamente se é receita ou despesa baseado no valor
- Atualiza saldos das contas automaticamente

### Interface do Usuário
- Drag & drop para upload de arquivos
- Pré-visualização em tabela formatada
- Barra de progresso durante importação
- Mensagens de erro claras e específicas
- Download de template XLSX com dados de exemplo

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- `src/components/shared/SimpleXLSXImporter.tsx` - Componente principal da importação
- `src/utils/xlsxTemplateGenerator.ts` - Gerador de templates XLSX

### Arquivos Modificados:
- `src/pages/ImportsXLSX.tsx` - Página atualizada para usar o novo componente

## 🚀 Como Usar

1. Acesse a página de importação XLSX
2. Clique em "Baixar Template XLSX" para obter um arquivo de exemplo
3. Preencha o template com seus dados seguindo a estrutura obrigatória
4. Faça upload do arquivo (drag & drop ou clique)
5. Selecione a conta de destino
6. Revise os dados na pré-visualização
7. Clique em "Confirmar Importação"
8. Aguarde o processamento e confirmação

## ⚠️ Limitações e Considerações

- Apenas arquivos XLSX/XLS são suportados
- As colunas devem estar na ordem exata especificada
- Linhas com dados inválidos são ignoradas silenciosamente
- O sistema não suporta múltiplas abas - apenas a primeira aba é processada
- Tags devem ser separadas por vírgula
- Valores negativos são automaticamente convertidos para despesas
