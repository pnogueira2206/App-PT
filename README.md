# App PT

Plataforma web (instalável como PWA), inspirada no CoachRx, para um treinador de CrossFit / personal trainer programar treinos individuais em calendário e receber os resultados dos alunos.

## Funcionalidades

- **Perfis individuais**: cada aluno tem a sua própria conta (email + palavra-passe).
- **Calendário semanal por aluno** (separador *Calendário* no perfil do aluno): treinos de cada dia com estado (rascunho, por fazer, em curso, feito, falhado). Cria um treino diretamente num dia com "+ Treino".
- **Grupos com calendário próprio**: um treino criado no calendário de um grupo aparece no calendário de cada membro, e **cada aluno reporta o seu resultado individualmente**. No treino de grupo, "Ajustar para X" cria uma versão individual (lesão, escala, carga) que substitui a do grupo só para esse aluno.
- **Copiar/colar** um treino, um dia ou uma semana inteira, para o mesmo calendário ou para outro aluno/grupo. Os treinos colados ficam em rascunho.
- **Rascunho vs. publicado**: o aluno só vê treinos publicados. "Publicar semana" publica todos os rascunhos da semana de uma vez.
- **Blocos por tipo**, cada um com o seu formato de score:
  - **Força**: séries × reps, carga, **% do 1RM** (o aluno vê a carga calculada a partir do seu recorde), tempo de execução, descanso → o aluno regista reps e carga por série + RPE.
  - **Metcon**: For Time, AMRAP, EMOM, For Reps, Carga máxima, com time cap/duração e o WOD → tempo, rondas + reps, reps ou carga, Rx/Scaled, RPE.
  - **Acessórios/mobilidade**: descrição livre, séries/reps opcionais → feito/não feito + notas.
  - **Cardio/endurance**: remo, corrida, bike, ski; distância, tempo, calorias, pace alvo → tempo, distância, calorias (pace calculado) + RPE.
  - Reordenar, duplicar, editar e remover blocos. Texto livre continua disponível como alternativa ao score estruturado.
- **Conclusão do treino**: o aluno marca a sessão como concluída com RPE da sessão e notas; o treinador vê tudo no treino e no calendário.
- **Biblioteca de exercícios** (*Exercícios*): categoria, notas de técnica e **link de vídeo** (YouTube/Instagram) mostrado ao aluno em cada bloco.
- **Perfil do aluno**: dados pessoais e recordes pessoais (Levantamentos / Treinos para tempo), editáveis pelo aluno e pelo treinador.
- **Histórico por exercício** com os scores estruturados.
- **PWA**: pode ser instalada no ecrã inicial do telemóvel (manifest + service worker).

O plano completo (fases seguintes) está em [`docs/PLANO.md`](docs/PLANO.md).

## Stack técnica

- [Next.js](https://nextjs.org) (App Router, TypeScript, Server Actions)
- [Prisma](https://www.prisma.io) + PostgreSQL
- [NextAuth v5](https://authjs.dev) (credenciais, sessão JWT)
- Tailwind CSS

## Como correr localmente

Precisas de um Postgres local (por exemplo com Docker):

```bash
docker run -d --name app-pt-db -e POSTGRES_USER=app -e POSTGRES_PASSWORD=app -e POSTGRES_DB=app_pt -p 5432:5432 postgres:16
```

```bash
npm install
cp .env.example .env      # edita o AUTH_SECRET
npx prisma migrate dev    # cria as tabelas
npm run db:seed           # (opcional) dados de exemplo na semana atual
npm run dev
```

Abre http://localhost:3000

> Para testar a build de produção localmente (`npm run build && npm run start`), define também `AUTH_TRUST_HOST=true` no `.env`. Na Vercel não é necessário.

### Contas de exemplo (após `npm run db:seed`)

| Papel      | Email                  | Palavra-passe  |
|------------|-------------------------|----------------|
| Treinador  | treinador@exemplo.com   | treinador123   |
| Aluna      | ana@exemplo.com         | aluno123       |
| Aluno      | bruno@exemplo.com       | aluno123       |

## Publicar online (Vercel + Neon)

1. Cria uma base de dados Postgres gratuita em [Neon](https://neon.tech) (ou Supabase). Copia a ligação *pooled* e a ligação *direta*.
2. Importa o repositório na [Vercel](https://vercel.com/new).
3. Em *Settings → Environment Variables* define:
   - `DATABASE_URL` — ligação *pooled* do Neon
   - `DIRECT_URL` — ligação direta do Neon (usada pelas migrações)
   - `AUTH_SECRET` — um valor aleatório longo (`openssl rand -hex 32`)
4. Faz deploy. O script `vercel-build` aplica as migrações (`prisma migrate deploy`) antes de compilar.
5. Cria a tua conta de treinador, a partir do teu computador, com o `.env` a apontar para a base de dados de produção:
   ```bash
   npm run create-trainer -- "O teu nome" o-teu@email.com uma-palavra-passe-forte
   ```
   Os alunos são criados por ti dentro da app (*Alunos*). Não corras o `db:seed` em produção.

## Notas de produção

- Muda `AUTH_SECRET` para um valor aleatório forte antes de publicar.
- Os ícones da PWA (`public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`) são um placeholder simples — substitui pelo logótipo do teu negócio quando tiveres um.
