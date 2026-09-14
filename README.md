# App PT

Plataforma web (instalável como PWA) para um personal trainer gerir alunos, grupos, treinos e acompanhar resultados.

## Funcionalidades

- **Perfis individuais**: cada aluno tem a sua própria conta (email + palavra-passe).
- **Grupos de alunos**: cria grupos (ex. "Turma da manhã") e atribui treinos a um grupo inteiro. Cada aluno do grupo reporta os seus resultados de forma individual.
- **Construtor de treinos**: cria treinos com vários blocos (exercício, séries/reps/carga prescritas, tempo de descanso e notas para o aluno).
- **Registo de resultados por bloco**: o aluno regista séries/reps/carga feitas, RPE e notas em cada bloco do treino, no telemóvel.
- **Recordes pessoais**: o aluno regista os seus PRs por exercício.
- **Histórico por exercício**: o aluno (e o treinador, no perfil do aluno) vê a evolução de resultados e recordes de cada exercício ao longo do tempo.
- **PWA**: pode ser instalada no ecrã inicial do telemóvel (manifest + service worker).

## Stack técnica

- [Next.js](https://nextjs.org) (App Router, TypeScript, Server Actions)
- [Prisma](https://www.prisma.io) + SQLite (fácil de migrar para Postgres/MySQL em produção)
- [NextAuth v5](https://authjs.dev) (credenciais, sessão JWT)
- Tailwind CSS

## Como correr localmente

```bash
npm install
cp .env.example .env      # edita o AUTH_SECRET
npx prisma migrate dev    # cria a base de dados SQLite
npm run db:seed           # (opcional) cria dados de exemplo
npm run dev
```

Abre http://localhost:3000

### Contas de exemplo (após `npm run db:seed`)

| Papel      | Email                  | Palavra-passe  |
|------------|-------------------------|----------------|
| Treinador  | treinador@exemplo.com   | treinador123   |
| Aluna      | ana@exemplo.com         | aluno123       |
| Aluno      | bruno@exemplo.com       | aluno123       |

## Como funciona

- O **treinador** entra em `/trainer`: cria alunos (define a palavra-passe inicial e partilha-a com o aluno), cria grupos, adiciona alunos aos grupos e cria treinos atribuídos a um grupo ou a um aluno específico. Dentro de cada treino, adiciona "blocos" (ex. "Bloco A" com o exercício, séries/reps/carga e notas). No perfil de cada aluno vê os recordes pessoais e o histórico de treinos/resultados.
- O **aluno** entra em `/student`: vê a lista de treinos atribuídos (diretamente ou via grupo), abre um treino e, bloco a bloco, regista o que fez (séries, reps, carga, RPE, notas). Na secção "Recordes" regista os seus PRs por exercício, e a partir de qualquer bloco ou recorde pode ver o histórico completo desse exercício.

## Notas de produção

- Muda `AUTH_SECRET` para um valor aleatório forte antes de publicar.
- SQLite é suficiente para uma base de alunos pequena/média; para produção com mais volume, muda o `datasource` do `prisma/schema.prisma` para Postgres e atualiza `DATABASE_URL`.
- Os ícones da PWA (`public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`) são um placeholder simples — substitui pelo logótipo do teu negócio quando tiveres um.
