# Análise: Sistema em Modo Família

## Visão Geral

O sistema Fynance atualmente opera em **modo individual**, onde cada usuário gerencia exclusivamente suas próprias finanças. Este documento descreve como seria a implementação do **Plano Família**, que permitiria múltiplos membros da família compartilharem e colaborarem no gerenciamento financeiro.

---

## 🏗️ Estrutura de Modos

### 1. Modo Individual (Atual)
- **Usuário único** com acesso exclusivo aos seus dados
- Todos os dados (transações, contas, cartões, etc.) são privados
- Plano atual: **Pro Individual** (R$ 15/mês)
- Isolamento completo através de RLS (Row Level Security)

### 2. Modo Família (Novo)
- **Múltiplos membros** (até 5-6 pessoas) compartilhando um espaço financeiro
- Dados compartilhados com diferentes níveis de permissão
- Plano: **Família** (sugestão: R$ 35-40/mês)
- Hierarquia de permissões (administrador e membros)

---

## 📊 Estrutura de Dados Necessária

### Tabelas Novas no Banco de Dados

#### 1. `family_groups`
```sql
CREATE TABLE public.family_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- Nome da família (ex: "Família Silva")
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription_tier TEXT DEFAULT 'individual' CHECK (subscription_tier IN ('individual', 'family')),
    max_members INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `family_members`
```sql
CREATE TABLE public.family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    permissions JSONB DEFAULT '{}'::jsonb, -- Permissões customizadas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(family_group_id, user_id)
);
```

#### 3. Modificações nas Tabelas Existentes

Adicionar campo `family_group_id` e `visibility` nas tabelas principais:

```sql
-- Adicionar campos nas transações
ALTER TABLE public.transactions 
ADD COLUMN family_group_id UUID REFERENCES public.family_groups(id) ON DELETE SET NULL,
ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'family', 'shared'));

-- Adicionar campos nas contas
ALTER TABLE public.accounts 
ADD COLUMN family_group_id UUID REFERENCES public.family_groups(id) ON DELETE SET NULL,
ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'family', 'shared'));

-- Adicionar campos nos cartões
ALTER TABLE public.cards 
ADD COLUMN family_group_id UUID REFERENCES public.family_groups(id) ON DELETE SET NULL,
ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'family', 'shared'));

-- Adicionar campos nos orçamentos
ALTER TABLE public.budgets 
ADD COLUMN family_group_id UUID REFERENCES public.family_groups(id) ON DELETE SET NULL,
ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'family', 'shared'));

-- Adicionar campos nas metas
ALTER TABLE public.goals 
ADD COLUMN family_group_id UUID REFERENCES public.family_groups(id) ON DELETE SET NULL,
ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'family', 'shared'));
```

---

## 👥 Hierarquia e Permissões

### Roles (Funções)

1. **Owner (Proprietário)**
   - Criador do grupo família
   - Acesso total a todas as funcionalidades
   - Gerenciar membros (adicionar/remover)
   - Gerenciar assinatura
   - Não pode ser removido

2. **Admin (Administrador)**
   - Pode ver e editar dados compartilhados
   - Pode adicionar/remover membros (exceto owner)
   - Pode gerenciar permissões
   - Não pode alterar configurações de assinatura

3. **Member (Membro)**
   - Pode ver e editar seus próprios dados
   - Pode ver dados marcados como "family" ou "shared"
   - Pode criar transações/orçamentos/metas compartilhadas
   - Não pode gerenciar membros

4. **Viewer (Visualizador)**
   - Apenas visualização de dados compartilhados
   - Não pode criar/editar dados
   - Ideal para filhos adolescentes ou consultores

### Níveis de Visibilidade

1. **Private (Privado)**
   - Apenas o criador vê
   - Comportamento atual (modo individual)

2. **Family (Família)**
   - Todos os membros ativos podem ver
   - Membros podem editar (dependendo da role)

3. **Shared (Compartilhado)**
   - Dados compartilhados explicitamente
   - Pode ter permissões específicas por membro

---

## 🎯 Funcionalidades do Modo Família

### 1. Gestão de Membros da Família

#### Adicionar Membros
- **Convite por email**: Enviar convite para novos membros
- **Código de convite**: Gerar código único para convite rápido
- **Aceitar convite**: Usuário recebe notificação e aceita o convite
- **Limite de membros**: Máximo de 5-6 membros por família

#### Gerenciar Permissões
- Definir role de cada membro
- Atribuir permissões customizadas por categoria/funcionalidade
- Revogar acesso quando necessário
- Histórico de convites e mudanças

### 2. Dashboard Familiar

#### Visão Consolidada
- **Resumo financeiro familiar**: Total de receitas, despesas, saldo
- **Gráficos combinados**: Visualização agregada de todos os membros
- **Gráficos por membro**: Comparação de gastos por pessoa
- **Métricas familiares**: Média de gastos, metas familiares, etc.

#### Filtros Avançados
- Filtrar por membro específico
- Filtrar por visibilidade (privado/compartilhado)
- Comparar períodos entre membros
- Visualização individual vs. familiar

### 3. Transações Compartilhadas

#### Funcionalidades
- **Marcar como compartilhada**: Ao criar transação, escolher visibilidade
- **Identificação do criador**: Mostrar quem criou cada transação
- **Comentários familiares**: Comentários visíveis para membros
- **Responsabilidade compartilhada**: Dividir custos entre membros
- **Notificações**: Alertar membros sobre transações importantes

#### Casos de Uso
- Contas da casa (luz, água, internet)
- Gastos com supermercado familiar
- Pagamentos de educação (filhos)
- Despesas médicas compartilhadas

### 4. Contas e Cartões Compartilhados

#### Contas Compartilhadas
- Conta conjunta familiar
- Conta poupança familiar
- Saldo consolidado vs. individual
- Histórico de movimentações compartilhado

#### Cartões Compartilhados
- Cartão de crédito familiar
- Limite compartilhado vs. individual
- Fatura consolidada
- Alertas de gastos por membro

### 5. Orçamentos Familiares

#### Orçamentos Compartilhados
- Orçamento mensal familiar (ex: R$ 3.000 para supermercado)
- Orçamento por categoria compartilhada
- Acompanhamento em tempo real
- Alertas quando próximo do limite
- Responsabilidade por membro

#### Orçamentos Individuais
- Cada membro pode ter seus próprios orçamentos privados
- Integração com orçamento familiar

### 6. Metas Financeiras Familiares

#### Metas Compartilhadas
- Meta de viagem em família
- Meta de poupança familiar
- Meta de investimento conjunto
- Progresso visual com contribuições por membro
- Celebrar conquistas em conjunto

#### Metas Individuais
- Metas privadas de cada membro
- Visíveis apenas para o criador

### 7. Dívidas e Recebíveis Compartilhados

#### Gestão de Dívidas Familiares
- Dívidas compartilhadas (empréstimos, financiamentos)
- Responsabilidade por membro
- Acompanhamento de pagamentos

### 8. Relatórios e Análises Familiares

#### Relatórios Consolidados
- Relatório financeiro mensal/anual familiar
- Análise de gastos por membro
- Comparação de padrões de consumo
- Tendências familiares
- Exportação de relatórios

#### Insights Familiares
- Categorias mais gastas em família
- Membros que mais gastam
- Economias potenciais identificadas
- Recomendações personalizadas

### 9. Configurações e Preferências

#### Configurações do Grupo
- Nome da família
- Foto/avatar do grupo
- Configurações de privacidade padrão
- Notificações familiares
- Idioma e moeda (se aplicável)

#### Preferências Individuais
- Cada membro mantém suas preferências pessoais
- Tema, notificações pessoais, etc.

### 10. Notificações e Comunicação

#### Sistema de Notificações
- Notificações sobre convites
- Alertas de gastos importantes
- Atualizações de orçamentos
- Conquistas de metas
- Mudanças de permissões

#### Feed Familiar (Opcional)
- Timeline de atividades financeiras importantes
- Comentários e interações
- Celebração de conquistas

---

## 💰 Estrutura de Planos e Preços

### Plano Individual (Atual)
- **Preço**: R$ 15/mês
- **Usuários**: 1 pessoa
- **Funcionalidades**: Todas as funcionalidades básicas
- **Compartilhamento**: Não disponível

### Plano Família (Novo)
- **Preço sugerido**: R$ 35-40/mês (ou R$ 25/mês + R$ 5 por membro adicional)
- **Usuários**: Até 5-6 membros
- **Funcionalidades**: 
  - Todas as funcionalidades do plano individual
  - Compartilhamento de dados
  - Dashboard familiar
  - Orçamentos e metas compartilhadas
  - Gestão de membros e permissões
  - Relatórios familiares
- **Economia**: Custo por pessoa menor que plano individual

### Modelo de Precificação Alternativo
- **Base Familiar**: R$ 30/mês (2 pessoas inclusas)
- **Membro adicional**: +R$ 8/mês por pessoa
- Exemplo: Família com 4 pessoas = R$ 30 + (2 × R$ 8) = R$ 46/mês

---

## 🔐 Segurança e Privacidade

### Proteção de Dados
- **Criptografia**: Todos os dados compartilhados criptografados
- **Auditoria**: Log de todas as ações dos membros
- **RLS Customizado**: Políticas de segurança baseadas em roles
- **Compliance**: LGPD/GDPR compliance

### Controle de Privacidade
- Dados privados sempre permanecem privados
- Usuário decide o que compartilhar
- Possibilidade de deixar grupo a qualquer momento
- Backup e exportação de dados

---

## 🎨 Interface do Usuário

### Seleção de Modo
- **Toggle no topo**: Alternar entre "Modo Individual" e "Modo Família"
- **Indicador visual**: Badge mostrando modo atual e número de membros
- **Menu contextual**: Opções diferentes baseadas no modo

### Páginas Específicas do Modo Família

1. **Página "Família"** (nova)
   - Lista de membros
   - Convites pendentes
   - Configurações do grupo
   - Estatísticas do grupo

2. **Dashboard Familiar**
   - Visão consolidada
   - Filtros por membro
   - Gráficos comparativos

3. **Configurações de Compartilhamento**
   - Por item (transação, conta, etc.)
   - Configuração em massa
   - Padrões de privacidade

---

## 🔄 Migração e Compatibilidade

### Migração de Individual para Família
1. Usuário individual pode criar grupo família
2. Converte sua conta em "owner" do grupo
3. Mantém todos os dados existentes
4. Dados existentes permanecem privados (visibility = 'private')
5. Pode começar a compartilhar gradualmente

### Compatibilidade
- **Dados antigos**: Todos os dados criados antes do modo família permanecem privados
- **RLS backward compatible**: Políticas antigas continuam funcionando
- **Migração gradual**: Não precisa migrar tudo de uma vez

---

## 📱 Funcionalidades Mobile

### Apps Mobile
- Todas as funcionalidades familiares disponíveis
- Notificações push para eventos familiares
- Convites via deep link
- Compartilhamento rápido de transações

---

## 🚀 Roadmap de Implementação Sugerido

### Fase 1: Fundação (MVP)
1. Estrutura de dados (tabelas family_groups, family_members)
2. Sistema de convites básico
3. RLS customizado para compartilhamento
4. Dashboard familiar básico

### Fase 2: Funcionalidades Core
1. Transações compartilhadas
2. Contas e cartões compartilhados
3. Orçamentos familiares
4. Metas compartilhadas

### Fase 3: Gestão Avançada
1. Sistema completo de permissões
2. Relatórios familiares
3. Notificações e alertas
4. Configurações avançadas

### Fase 4: Melhorias e Otimizações
1. Feed familiar
2. Analytics avançados
3. Integração com outros serviços
4. Recursos premium familiares

---

## 📊 Comparação: Individual vs. Família

| Funcionalidade | Individual | Família |
|---------------|------------|---------|
| Usuários | 1 | 5-6 |
| Transações | Privadas | Privadas + Compartilhadas |
| Contas | Individuais | Individuais + Compartilhadas |
| Dashboard | Individual | Individual + Familiar |
| Orçamentos | Individuais | Individuais + Familiares |
| Metas | Individuais | Individuais + Compartilhadas |
| Relatórios | Individual | Individual + Familiar |
| Gestão de Membros | ❌ | ✅ |
| Compartilhamento | ❌ | ✅ |
| Permissões Granulares | ❌ | ✅ |
| Preço | R$ 15/mês | R$ 35-40/mês |

---

## 🎯 Casos de Uso Principais

### Caso 1: Casal Jovem
- Compartilham contas da casa
- Orçamento conjunto para casa e viagens
- Metas de poupança para casamento/compra de casa
- Cada um mantém gastos pessoais privados

### Caso 2: Família com Filhos
- Pais administram o grupo
- Filhos adolescentes como "viewers" ou "members"
- Orçamento familiar para educação e lazer
- Controle de mesada e gastos dos filhos

### Caso 3: Família Estendida
- Compartilham apenas despesas comuns (casa dos avós, etc.)
- Maioria dos dados permanece privada
- Relatórios consolidados para planejamento

---

## ✅ Conclusão

O **Plano Família** transformaria o Fynance de uma ferramenta individual em uma plataforma colaborativa, permitindo que famílias gerenciem suas finanças de forma integrada e transparente, mantendo a privacidade quando necessário.

A implementação seria complexa, mas o valor agregado para famílias seria significativo, diferenciando o produto no mercado e criando uma nova fonte de receita recorrente.

