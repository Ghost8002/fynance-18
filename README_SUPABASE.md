
# Integração com Supabase - Sistema Financeiro

## Configuração Inicial

### 1. Configurar Variáveis de Ambiente
Após conectar o projeto ao Supabase, você precisará configurar as seguintes variáveis de ambiente:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 2. Executar o Schema do Banco
Execute o arquivo `database/schema.sql` no editor SQL do Supabase para criar todas as tabelas necessárias.

### 3. Dados de Teste (Opcional)
Execute o arquivo `database/seed.sql` para inserir dados de exemplo (substitua 'your-user-id-here' por IDs reais).

## Estrutura do Banco de Dados

### Tabelas Principais:
- **user_profiles**: Perfis estendidos dos usuários
- **accounts**: Contas bancárias
- **cards**: Cartões de crédito
- **categories**: Categorias de receitas/despesas
- **transactions**: Transações financeiras
- **budgets**: Orçamentos por categoria
- **goals**: Metas financeiras

### Recursos Implementados:
- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Políticas de segurança por usuário
- ✅ Triggers para updated_at automático
- ✅ Relacionamentos entre tabelas
- ✅ Validações de integridade

## Hooks Preparados

### useSupabaseAuth
- `signIn()` - Login com email/senha
- `signUp()` - Registro com email/senha
- `signOut()` - Logout
- `resetPassword()` - Reset de senha
- `user` - Usuário atual
- `session` - Sessão atual
- `loading` - Estado de carregamento

### useSupabaseData
Hook genérico para operações CRUD:
- `data` - Dados da tabela
- `loading` - Estado de carregamento
- `insert()` - Inserir novo registro
- `update()` - Atualizar registro
- `remove()` - Remover registro
- `refetch()` - Recarregar dados

## Próximos Passos

1. **Conectar ao Supabase**: Clique no botão verde "Supabase" no topo da interface
2. **Configurar Autenticação**: O sistema está pronto para usar auth do Supabase
3. **Migrar Context**: Substituir o FinancialContext local pelos hooks do Supabase
4. **Testar Funcionalidades**: Todas as operações CRUD estão preparadas

## Segurança

- Todas as tabelas têm RLS habilitado
- Usuários só podem acessar seus próprios dados
- Políticas de segurança implementadas para todas as operações
- Validações de integridade no banco de dados

## Instalação de Dependências

Será necessário instalar o cliente do Supabase:
```bash
npm install @supabase/supabase-js
```
