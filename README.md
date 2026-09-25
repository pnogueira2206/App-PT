# CFA Avaliações

Plataforma web (instalável como PWA) para a CrossFit Alvalade avaliar o desempenho dos treinadores em substituição da grelha em papel.

## Funcionalidades

- **Nova Avaliação**: grelha completa por secções, fiel à ficha original (pontos parciais e N/A por critério, notas por dimensão em tempo real), classificação geral, spider web por pilar da própria avaliação, plano de ação sugerido a partir dos pilares mais fracos, e confirmação do avaliador.
- **Histórico**: lista de avaliações com filtros (treinador, tipo de aula, período, classificação), detalhe só de leitura, e confirmação da avaliação pelo próprio treinador (a partir da conta dele).
- **Por Treinador**: evolução da classificação geral ao longo do tempo, spider web por pilar (Ensinar, Ver, Corrigir, Gestão de Grupo, Presença e Atitude, Demonstração) comparando a última avaliação com a anterior, e comentários da última avaliação.
- **Admin** (só Admin): gestão de treinadores e avaliadores (adicionar, editar, desativar, repor palavra-passe), tipos de aula, espaços (CFA Oriente/Carnaxide), e da grelha (secções/critérios — editar, adicionar, reordenar, desativar, nunca apagar), atribuição de pilares a cada critério, registo de atividade (logins, avaliações vistas/criadas, exportações, alterações de conta), e exportação de todas as avaliações para CSV.
- **Perfil**: qualquer conta pode alterar a própria palavra-passe.
- **PWA**: pode ser instalada no ecrã inicial do telemóvel, com ícones e favicon com a identidade visual da CFA.

## Stack técnica

- [Next.js](https://nextjs.org) (App Router, TypeScript, Server Actions)
- [Prisma](https://www.prisma.io) + PostgreSQL
- [NextAuth v5](https://authjs.dev) (credenciais, sessão JWT, 3 papéis: Admin/Avaliador/Treinador)
- Tailwind CSS

## Como correr localmente

Precisas de um PostgreSQL a correr (local ou remoto) antes do próximo passo.

```bash
npm install
cp .env.example .env      # edita AUTH_SECRET e DATABASE_URL (a tua ligação Postgres)
npx prisma migrate dev    # cria as tabelas
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
- O **admin** vê tudo, mais a área "Admin" para gerir treinadores, avaliadores, tipos de aula, espaços, a grelha de avaliação, o registo de atividade, e exportar dados.
- Cada avaliação guardada leva consigo uma cópia da grelha (secções/critérios) tal como estava no momento em que foi preenchida — editar a grelha no Admin não altera avaliações já guardadas.
- Não há recuperação de password por email (não há serviço de email configurado). Em vez disso, o Admin repõe a palavra-passe de qualquer treinador ou avaliador em "Admin > Treinadores/Avaliadores" e partilha-a com a pessoa; qualquer conta também pode alterar a própria palavra-passe em "O meu perfil".
- **Segurança do login**: 5 tentativas falhadas seguidas bloqueiam a conta por 15 minutos; um reset de password pelo Admin desbloqueia-a de imediato. Todo o acesso relevante (logins, avaliações vistas/criadas, exportações, alterações de conta) fica registado em "Admin > Registo de Atividade".

## Base de dados em produção

Este projeto usa PostgreSQL desde o início (não SQLite). Para publicar:

1. Cria uma base de dados PostgreSQL num serviço à tua escolha (ex: Neon, Supabase, Railway, RDS, ou um servidor próprio).
2. Define `DATABASE_URL` no ambiente de produção com essa ligação.
3. Corre `npx prisma migrate deploy` para aplicar as migrações.
4. Corre `npx prisma db seed` uma vez, se quiseres as contas/dados de exemplo (ou cria as contas reais diretamente pela interface, como Admin).

## RGPD / Proteção de dados

- **Política de privacidade**: `/privacidade`, acessível sem login. Tem dois campos por confirmar antes de publicar
  (destacados a amarelo na página): o contacto para pedidos de privacidade, e o nome/país do fornecedor de
  alojamento da base de dados.
- **Acesso e portabilidade**: qualquer conta pode descarregar tudo o que a app guarda sobre ela própria
  ("O meu perfil" → "Os meus dados") — dados de conta, avaliações e registo de atividade, em JSON.
- **Direito ao apagamento**: o Admin pode "Anonimizar" um treinador ou avaliador em vez de o desativar. Substitui o
  nome e o email por um valor anónimo — é irreversível, e mantém o histórico de avaliações intacto (sem
  identificar a pessoa).
- **Retenção do registo de atividade**: apagado automaticamente ao fim de 12 meses (`RETENCAO_AUDITORIA_DIAS` em
  `src/lib/auditoria.ts`).
- **Por decidir**: as avaliações em si não têm apagamento automático por prazo — isso é uma decisão de negócio (que
  prazo, se algum) que ainda falta tomar. Também falta um acordo de subcontratante (DPA) com o fornecedor de
  alojamento assim que for escolhido, e nomear quem responde a pedidos de privacidade.

## Notas de produção

- Muda `AUTH_SECRET` para um valor aleatório forte antes de publicar.
- Os ícones da PWA (`public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`) ainda são placeholders — substituir pelo logótipo definitivo da CrossFit Alvalade.
