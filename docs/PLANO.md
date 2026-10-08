# Plano da App PT (inspirada no CoachRx)

Plano de evolução da app atual (Next.js + Prisma, PWA) para uma ferramenta de **programação individual** e **feedback dos alunos**, para um treinador de CrossFit/personal trainer que acompanha atletas de competição e alunos de saúde e bem-estar.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Base | Evoluir a app atual (não recomeçar). Continua PWA, sem lojas de apps. |
| Utilizadores | Só um treinador. Sem pagamentos dentro da app. |
| Entrega de treinos | **Calendário individual** por aluno. Pode-se criar um treino para um **grupo** (alunos de PT que treinam juntos): aparece no calendário de cada um e **cada aluno reporta o seu score individualmente**. |
| Tipos de bloco | Força, Metcon (For Time / AMRAP / EMOM…), Acessórios/mobilidade e Cardio/endurance. |
| Feedback | Tudo: scores estruturados, check-in de prontidão, vídeos de técnica e comentários/chat. |
| Alertas | Painel "novidades" + notificações push, que se podem **desativar** (por tipo). |
| Escala/alojamento | Até ~50 alunos: Vercel + Postgres gerido (Neon ou Supabase) + armazenamento de ficheiros para vídeos. |
| Biblioteca de exercícios | Cada exercício tem um link de vídeo (YouTube/Instagram) com a demonstração. |
| **Prioridade da 1.ª versão** | **Calendário + programação + scores estruturados.** Comunicação, vídeos e notificações ficam para depois. |
| Mais tarde | Módulo saúde/bem-estar e módulo competição (ver Fase 5). |

## Fases

### Fase 0 — Fundações ✅ implementada
- Mudar a base de dados de SQLite para **Postgres** (necessário para alojar na Vercel).
- Configurar o deploy (Vercel + Neon/Supabase) e variáveis de ambiente.
- Biblioteca de exercícios: página para gerir exercícios com nome, categoria (força, ginástica, halterofilia, cardio, mobilidade) e **link de vídeo**. O aluno vê o link no treino.

### Fase 1 — Programação em calendário ✅ implementada
**Treinador**
- Vista **semanal do calendário de cada aluno** (seg–dom), com os treinos de cada dia e o estado (por fazer / feito / falhado).
- Criar ou editar um treino diretamente num dia do calendário.
- Treino de **grupo**: escolher o grupo e o dia, e o treino aparece no calendário de todos os membros. O treinador pode **ajustar um treino de grupo para um aluno específico** (ex. carga ou exercício diferente por lesão) sem afetar os outros.
- **Copiar/colar** um treino, um dia ou uma semana inteira (para o mesmo aluno ou para outro). Serve de "template" simples até haver uma biblioteca de templates.
- **Rascunho vs. publicado**: o aluno só vê os treinos publicados.
- Reordenar blocos e duplicar blocos.

**Construtor de blocos por tipo** (o tipo define o que o aluno regista):

| Tipo | Prescrição | Score do aluno |
|---|---|---|
| Força | séries × reps, carga em kg **ou % do 1RM**, tempo de descanso, tempo de execução | carga e reps **por série**, RPE |
| Metcon | formato (For Time, AMRAP, EMOM, For Reps, Max Load), time cap, descrição do WOD | tempo **ou** rondas+reps **ou** carga/reps, **Rx/Scaled**, RPE |
| Acessórios/mobilidade | descrição livre, séries/reps opcionais | feito / não feito, notas |
| Cardio/endurance | modalidade (remo, corrida, bike, ski), distância/tempo/calorias, pace alvo | tempo, distância, calorias, pace, RPE |

- Prescrição por **% do 1RM**: se o aluno tiver o recorde do exercício registado, a app mostra a carga já calculada em kg (ex. "75% → 82,5 kg").
- Todos os blocos mantêm as **notas do treinador**.

**Aluno**
- Ecrã **Hoje** com o treino do dia e uma vista da **semana**, com navegação para semanas anteriores.
- Abrir um bloco, ver a prescrição e o vídeo do exercício e registar o score no formato certo para o tipo de bloco (com o texto livre como alternativa).
- Marcar o treino como concluído, com uma nota geral e o RPE da sessão.

### Fase 2 — Ver os resultados (fecha o ciclo da prioridade)
- Painel do treinador **"Novidades"**: lista cronológica de treinos concluídos, scores e notas dos alunos, com o estado "visto/não visto".
- **Comentar um resultado**: resposta curta do treinador ao score (o início do feedback bidirecional).
- **Adesão**: % de treinos feitos por aluno, na semana e no mês.
- **Recordes automáticos**: quando um score bate o recorde de um exercício, a app sugere guardá-lo como novo PR.
- Histórico por exercício com **gráfico de evolução** (carga ou tempo).

### Fase 3 — Comunicação e feedback completo
- **Check-in de prontidão** antes do treino (sono, energia, stress, dor muscular, de 1 a 5, e dores/lesões em texto), visível no calendário do treinador.
- **Comentários por treino**: conversa entre o treinador e o aluno associada a um treino.
- **Mensagens diretas** treinador ↔ aluno.

### Fase 4 — Notificações e vídeos
- **Notificações push** da PWA (Web Push):
  - para o treinador: aluno concluiu um treino, nova mensagem, novo vídeo, check-in com valores baixos;
  - para o aluno: treinos novos publicados, comentário do treinador.
  - **Preferências por tipo**, com a opção de as desligar todas.
- **Vídeos de técnica**: o aluno carrega um vídeo curto (limite de ~60 s e de tamanho) num bloco e o treinador comenta. Armazenamento em Vercel Blob, Supabase Storage ou Cloudflare R2, com os vídeos antigos apagados ao fim de X meses para controlar custos.

### Fase 5 — Mais tarde (fora da 1.ª versão)
**Saúde e bem-estar**
- Avaliações físicas: medidas, % de gordura, fotos de progresso e testes periódicos.
- Objetivos do aluno, lesões/limitações e notas privadas do treinador.
- Hábitos simples: checklist diária (água, passos, proteína, sono).

**Competição**
- Biblioteca de **benchmarks** (Fran, Grace, Murph, Girls/Heroes) com histórico e PRs automáticos.
- **Leaderboard** dos alunos de um grupo para o mesmo treino.
- **Calendário de competições** e organização dos ciclos (fases/mesociclos) até à data da prova.

**Programação avançada**
- Biblioteca de **templates** e programas de várias semanas, aplicáveis a um aluno a partir de uma data.

## Alterações principais ao modelo de dados (Fases 0–2)

- `Workout`: `date` passa a ser obrigatório; novos campos `status` (DRAFT/PUBLISHED), `completedAt` por aluno (ver `WorkoutCompletion`) e `sourceWorkoutId` (para os ajustes individuais de um treino de grupo).
- `WorkoutBlock`: novo `type` (STRENGTH, METCON, ACCESSORY, CARDIO) e campos de prescrição por tipo: `metconFormat`, `timeCapSeconds`, `percent1RM`, `tempo`, `cardioModality` e `targetDistance`/`targetTime`/`targetCalories`.
- `BlockResult`: campos estruturados (`timeSeconds`, `rounds`, `reps`, `loadKg`, `distanceM`, `calories`, `rx` (bool), `rpe`, `done`); mantém `scoreText` como alternativa livre.
- Novo `SetLog` (resultado por série dos blocos de força): `setNumber`, `reps` e `loadKg`.
- Novo `WorkoutCompletion` (aluno + treino): `completedAt`, `sessionRpe` e `notes`.
- `Exercise`: `category` e `videoUrl`.
- Novo `ResultComment` (Fase 2) e, mais tarde, `ReadinessCheckIn`, `Message`, `PushSubscription`/`NotificationPreference` e `MediaUpload`.

## Decisões por defeito (alterar se necessário)
- Unidades em **kg** e metros; interface em português de Portugal.
- O aluno vê os treinos publicados da semana atual e das seguintes; o treinador decide quando publica.
- Os scores podem ser editados pelo aluno depois de submetidos (o treinador vê a data da última alteração).
- Os resultados de um treino de grupo são sempre individuais. Não há ranking entre colegas até ao módulo de competição.

## Estado

- **Fases 0 e 1 implementadas.** Notas de implementação:
  - O deploy em produção (Vercel + Neon) está preparado (scripts e instruções no README) mas tem de ser feito com as tuas contas.
  - A conta de treinador em produção cria-se com `npm run create-trainer`.
  - Ao passar de SQLite para Postgres, as migrações foram recomeçadas: dados de teste numa `dev.db` antiga não são migrados.
  - Os treinos colados ficam sempre em rascunho. "Publicar semana" num aluno publica só os treinos dele; os de grupo publicam-se no calendário do grupo.
  - "Copiar semana/dia" no calendário de um aluno copia os treinos individuais dele (incluindo versões ajustadas); os treinos de grupo copiam-se a partir do calendário do grupo.
- **Próximo passo:** validar com 2–3 alunos reais e depois avançar para a Fase 2 (painel "Novidades", comentários aos resultados, adesão, PRs automáticos e gráficos).
