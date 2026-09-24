# CFA Avaliações

Plataforma web (instalável como PWA) para a CrossFit Alvalade avaliar o desempenho dos treinadores em substituição da grelha em papel.

## Funcionalidades

- **Nova Avaliação**: grelha completa por secções, fiel à ficha original (pontos parciais e N/A por critério, notas por dimensão em tempo real), classificação geral e confirmação do avaliador.
- **Histórico**: lista de avaliações com filtros (treinador, tipo de aula, período, classificação), detalhe só de leitura, e confirmação da avaliação pelo próprio treinador (a partir da conta dele).
- **Por Treinador**: evolução da classificação geral ao longo do tempo, spider web por pilar (Ensinar, Ver, Corrigir, Gestão de Grupo, Presença e Atitude, Demonstração) comparando a última avaliação com a anterior, e comentários da última avaliação.
- **Admin** (só Admin): gestão de treinadores, tipos de aula e da grelha (secções/critérios — editar, adicionar, reordenar, desativar, nunca apagar), atribuição de pilares a cada critério, e exportação de todas as avaliações para CSV.
- **PWA**: pode ser instalada no ecrã inicial do telemóvel.

## Stack técnica

- [Next.js](https://nextjs.org) (App Router, TypeScript, Server Actions)
- [Prisma](https://www.prisma.io) + SQLite (fácil de migrar para Postgres em produção)
- [NextAuth v5](https://authjs.dev) (credenciais, sessão JWT, 3 papéis: Admin/Avaliador/Treinador)
- Tailwind CSS

## Como correr localmente

```bash
npm install
cp .env.example .env      # edita o AUTH_SECRET
npx prisma migrate dev    # cria a base de dados SQLite
npm run db:seed           # cria contas e dados de exemplo
npm run dev
```

Abre http://localhost:3000

### Contas de exemplo (após `npm run db:seed`)

| Papel      | Email                  | Palavra-passe  |
|------------|-------------------------|----------------|
| Admin      | admin@cfa.pt            | admin123       |
| Avaliador  | headcoach1@cfa.pt (e 2, 3) | coach123    |
| Treinador  | treinadora@cfa.pt (e b..f) | treino123   |

## Como funciona

- O **avaliador** (head coach) entra e vê "Nova Avaliação" e "Histórico"/"Por Treinador" de todos os treinadores.
- O **treinador** entra e só vê "Histórico"/"Por Treinador" com os dados dele próprio; confirma cada avaliação a partir da própria conta.
- O **admin** vê tudo, mais a área "Admin" para gerir treinadores, tipos de aula, a grelha de avaliação e exportar dados.
- Cada avaliação guardada leva consigo uma cópia da grelha (secções/critérios) tal como estava no momento em que foi preenchida — editar a grelha no Admin não altera avaliações já guardadas.

## Notas de produção

- Muda `AUTH_SECRET` para um valor aleatório forte antes de publicar.
- SQLite chega para desenvolvimento e um piloto pequeno; para produção com os 2 espaços em simultâneo, muda o `datasource` do `prisma/schema.prisma` para Postgres e atualiza `DATABASE_URL`.
- Não há ainda recuperação de password por email, nem gestão de contas de avaliador pela interface (só via seed/base de dados).
- Os ícones da PWA (`public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`) ainda são placeholders — substituir pelo logótipo definitivo da CrossFit Alvalade.
