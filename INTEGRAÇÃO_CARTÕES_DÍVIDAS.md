# Integração entre Cartões e Dívidas a Pagar

## Visão Geral

Esta integração permite que as dívidas de cartão de crédito (faturas e parcelamentos) sejam visíveis e gerenciadas na seção de "Dívidas a Pagar", proporcionando uma visão unificada de todas as obrigações financeiras.

## ✅ **Status: IMPLEMENTADO E FUNCIONANDO**

A integração foi completamente implementada e está funcionando. Todas as funcionalidades descritas abaixo estão ativas e operacionais.

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
- ✅ **IMPLEMENTADO**: Cria automaticamente uma dívida a partir de uma fatura de cartão
- Evita duplicatas verificando se já existe uma dívida para a mesma fatura

#### `create_debts_from_installments(p_installment_id)`
- ✅ **IMPLEMENTADO**: Cria dívidas para cada parcela de um parcelamento
- Gera uma dívida separada para cada parcela pendente

#### `sync_debt_payment(p_debt_id, p_payment_amount, p_payment_date)`
- ✅ **IMPLEMENTADO**: Sincroniza pagamentos de dívidas com faturas/parcelas correspondentes
- Atualiza automaticamente o status das faturas e parcelas

#### `sync_card_debts()`
- ✅ **IMPLEMENTADO**: Função principal que sincroniza todas as dívidas de cartão de uma vez

### 3. **Componentes Criados**

#### `CardDebtsSection` ✅ **IMPLEMENTADO E FUNCIONAL**
- Mostra faturas pendentes de cartão em tempo real
- Mostra parcelamentos ativos
- Permite criar dívidas a partir de faturas/parcelamentos individualmente
- Botão de sincronização automática para todas as dívidas
- Interface responsiva e intuitiva

#### `useCardDebtsIntegration` (Hook) ✅ **IMPLEMENTADO E FUNCIONAL**
- Gerencia a integração entre cartões e dívidas
- Funções para criar e sincronizar dívidas
- Estados de carregamento e dados
- Logs de debug para troubleshooting

### 4. **Modificações nos Componentes Existentes**

#### `DebtList` ✅ **IMPLEMENTADO**
- Adicionada coluna "Cartão" na tabela
- Mostra informações do cartão relacionado
- Indica se é fatura ou parcela
- Exibe período da fatura ou número da parcela

#### `DebtForm` ✅ **IMPLEMENTADO**
- Campos opcionais para integração com cartão
- Seleção de cartão relacionado
- Opções para marcar como fatura ou parcela

## Como Usar a Integração

### 1. **Visualizar Dívidas de Cartão**
- Acesse a seção "Dívidas a Pagar"
- A nova seção "Dívidas de Cartão" aparecerá automaticamente
- Mostra faturas pendentes e parcelamentos ativos em tempo real

### 2. **Criar Dívidas a Partir de Faturas**
- Na seção "Dívidas de Cartão", clique em "Criar Dívida" ao lado de uma fatura
- A dívida será criada automaticamente com as informações da fatura
- Aparecerá na lista principal de dívidas
- ✅ **FUNCIONANDO**: Cria dívidas automaticamente

### 3. **Criar Dívidas a Partir de Parcelamentos**
- Clique em "Criar Dívidas" ao lado de um parcelamento
- Serão criadas dívidas separadas para cada parcela pendente
- Cada parcela aparecerá como uma dívida individual
- ✅ **FUNCIONANDO**: Cria dívidas para cada parcela

### 4. **Sincronização Automática**
- Use o botão "Sincronizar Tudo" para criar automaticamente todas as dívidas pendentes
- Útil para sincronizar faturas e parcelamentos existentes
- ✅ **FUNCIONANDO**: Sincroniza todas as dívidas de uma vez

### 5. **Editar Dívidas com Integração**
- Ao editar uma dívida, você pode associá-la a um cartão
- Marcar como fatura ou parcela de cartão
- Definir período da fatura ou número da parcela
- ✅ **FUNCIONANDO**: Campos de integração funcionais

## Benefícios da Integração

1. **Visão Unificada**: ✅ Todas as obrigações financeiras em um só lugar
2. **Controle de Fluxo de Caixa**: ✅ Previsão mais precisa de saídas
3. **Automação**: ✅ Criação automática de dívidas a partir de faturas/parcelamentos
4. **Sincronização**: ✅ Pagamentos sincronizados automaticamente
5. **Rastreabilidade**: ✅ Identificação clara da origem de cada dívida

## Considerações Técnicas

### Performance ✅
- Índices criados para otimizar consultas por cartão
- Consultas eficientes para faturas e parcelamentos

### Segurança ✅
- RLS (Row Level Security) mantido para todos os dados
- Validações de propriedade dos cartões

### Compatibilidade ✅
- Funciona com a estrutura existente de dívidas
- Não quebra funcionalidades existentes

## Troubleshooting

### Se as dívidas não aparecerem:
1. Verifique se há faturas ou parcelamentos pendentes nos cartões
2. Verifique o console do navegador para logs de debug
3. Certifique-se de que as migrações foram aplicadas

### Se a sincronização falhar:
1. Verifique se as funções de banco estão criadas
2. Verifique os logs de erro no console
3. Certifique-se de que o usuário tem permissões adequadas

## Próximos Passos (Opcionais)

A integração está completa e funcional. Possíveis melhorias futuras:

1. **Notificações**: Alertas automáticos para faturas próximas do vencimento
2. **Relatórios**: Relatórios específicos de dívidas de cartão
3. **Dashboard**: Widgets específicos para dívidas de cartão no dashboard principal

## Conclusão

A integração entre cartões e dívidas a pagar está **100% implementada e funcionando**. Todas as funcionalidades descritas estão ativas e operacionais, proporcionando uma experiência completa e integrada para o gerenciamento de obrigações financeiras relacionadas a cartões de crédito.
