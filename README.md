# Ritmo — versão para Vercel

Aplicação Next.js para organizar rotina, progresso, finanças, projeto principal, ideias e histórico.

## Requisitos

- Node.js 20.9 ou superior
- npm 10 ou superior

## Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Validação de produção

```bash
npm run lint
npm run build
npm run start
```

## Configuração do Supabase

Crie um arquivo `.env.local` a partir de `.env.example` e preencha somente as
credenciais públicas do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

O esquema versionado está em `supabase/migrations`. Ele cria autenticação,
tabelas por usuário e políticas de Row Level Security. O banco inicia sem dados
de exemplo.

## Publicar na Vercel

1. Envie esta pasta para um repositório no GitHub.
2. Na Vercel, escolha **Add New > Project**.
3. Importe o repositório.
4. Configure `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` nos ambientes da Vercel.
5. Confirme o framework **Next.js** e publique.

Não é necessário configurar comando de build ou diretório de saída; a Vercel
detecta o Next.js automaticamente.

## Persistência

Os dados são salvos no Supabase e isolados por usuário por meio de RLS. O app
não importa dados do `localStorage` e cada conta nova começa vazia.

## Estrutura principal

- `app/page.tsx`: interface e regras do produto
- `app/globals.css`: estilos e temas
- `components/ui/`: componentes de interface
- `lib/supabase/`: clientes de autenticação e sessão
- `supabase/migrations/`: esquema e políticas de segurança
- `next.config.ts`: configuração do Next.js
