# MAPA DE BORDO — Dr. Francisco Furtado

> **Regra permanente:** tudo o que for decidido, feito, adiado ou sugerido neste projeto **deve** ser registrado neste arquivo. Nenhuma entrega fica só no chat ou no código sem espelho aqui. Atualizar nas seções **Feito**, **Pendente** e **Ideias** a cada ciclo de trabalho.

**Última atualização:** 2026-07-15 (Pacote C folículo 3D entregue)  
**Branch:** `cursor/site-institucional-mapa-bordo-e94e`  
**Domínio:** www.ffurtado.com.br  
**Região SEO:** Fortaleza e todo o Ceará

---

## 1. Visão do produto

Dois produtos no mesmo ecossistema:

| Produto | Público | Objetivo |
|--------|---------|----------|
| **Site institucional** | Visitantes / leads | Autoridade, confiança, agendamentos |
| **Área do cliente (portal)** | Pacientes + Dr. (admin) + eventual secretaria | Acompanhamento de 12 meses com protocolo fotográfico e gestão clínica |

**Não usaremos WordPress.** Edição de conteúdo do site e gestão clínica passam por área autenticada (admin) e/ou arquivos versionados na fase institucional.

### Pilares de marca (site)

Ciência · Arte · Cuidado humano — tom confiante, técnico e acolhedor.

### Contatos oficiais

| Canal | Valor |
|-------|--------|
| Site | www.ffurtado.com.br |
| WhatsApp | (88) 9.9252-4200 |
| Instagram | @dr.franciscofurtado |
| E-mail | atendimento@ffurtado.com.br |

---

## 2. Decisões técnicas travadas

| Tema | Decisão |
|------|---------|
| Stack site | Next.js (App Router) + TypeScript + Tailwind CSS |
| Conteúdo público v1 | `content/` (JSON/MDX) + painel admin para gestão clínica; CMS WordPress **fora** |
| SEO local | Fortaleza + Ceará |
| Identidade | Paleta séria: preto/cinzas/navy/`#96a4c9`/`#c7ccdb`/`#dcdfe6` + dourado. Evitar `#82c4d1` `#a5e1ed` `#c2dadf` em superfícies |
| Tipografia | Poppins (Nexa), Bebas Neue (ARCHTH), Arapey, script só na assinatura |
| Auth portal | Login separado: **Admin** (Dr. Francisco) e **Paciente**; papel opcional **Assistente** |
| Dados clínicos | PostgreSQL + Prisma; fotos em storage privado (S3/R2) com URLs assinadas |
| LGPD | Consentimentos, retenção definida, auditoria de acesso às fotos, sem URL pública permanente |

---

## 3. Área do cliente — conceito aprimorado

### 3.1 Problema que resolve

O pós-transplante exige acompanhamento visual ao longo de ~12 meses. Sem protocolo, o paciente envia fotos irregulares no WhatsApp; o médico perde histórico e comparabilidade. O portal padroniza o envio, organiza o tempo clínico e reforça o diferencial de **cuidado contínuo** da marca.

### 3.2 Personas e papéis

| Papel | Acesso | Capacidades principais |
|-------|--------|------------------------|
| **Admin (Dr. Francisco)** | `/admin` | CRUD de pacientes, ver/analisar fotos, notas clínicas, liberar feedback, dashboard de pendências |
| **Assistente** (fase 2) | `/admin` limitado | Cadastrar paciente, resetar senha, marcar consulta — **sem** editar notas clínicas profundas |
| **Paciente** | `/paciente` | Ver jornada, enviar 5 fotos por checkpoint, ler feedback liberado, checklist pós-op |

### 3.3 Protocolo fotográfico (5 regiões)

Em **cada** checkpoint, o paciente envia **obrigatoriamente 5 fotos**:

| # | Região | Objetivo clínico |
|---|--------|------------------|
| 1 | Frontal / linha anterior | Densidade e desenho da entrada |
| 2 | Superior / vértex | Cobertura do topo |
| 3 | Coroa / occipital receptor | Área de coroa |
| 4 | Temporal / perfil esquerdo | Ângulos laterais |
| 5 | Temporal / perfil direito | Ângulos laterais |

**UX de upload aprimorada:**

- Guia visual (silhueta/overlay) por região antes de capturar ou escolher arquivo
- Dicas: luz natural, fundo neutro, cabelo seco, sem filtros, mesma distância aproximada
- Validação: todas as 5 obrigatórias para “enviar checkpoint”
- Compressão WebP no cliente + limite de tamanho; EXIF removido no servidor (privacidade)

### 3.4 Linha do tempo — 12 meses

Ancorada na **data do procedimento** (`dataCirurgia`):

| Checkpoint | Quando | Fotos | Status típico |
|------------|--------|-------|----------------|
| **M0 — Baseline** | Dia do procedimento ou 1ª consulta pós | 5 | Registro inicial |
| **M3** | +3 meses | 5 | Envio do paciente |
| **M6** | +6 meses | 5 | Envio do paciente |
| **M9** | +9 meses | 5 | Envio do paciente |
| **M12** | +12 meses | 5 | Envio + fechamento do ciclo |

**Janela de envio:** de **7 dias antes** até **14 dias depois** da data alvo. Fora da janela: status “atrasado” (paciente ainda pode enviar; admin vê alerta).

**Por paciente / ano:** até 5 checkpoints × 5 fotos = **25 fotos clínicas** + metadados.

### 3.5 Fluxo de status (por checkpoint)

```text
AGUARDANDO → EM_JANELA → ENVIADO → EM_ANALISE → FEEDBACK_LIBERADO
                ↓
            ATRASADO (pode voltar a ENVIADO)
```

1. Sistema abre a janela (e notifica)
2. Paciente envia 5 fotos → `ENVIADO`
3. Admin abre análise → `EM_ANALISE`
4. Admin registra avaliação + (opcional) feedback ao paciente → `FEEDBACK_LIBERADO`

### 3.6 Painel do paciente (`/paciente`)

- **Dashboard:** progresso “X de 12 meses”, próximo checkpoint, countdown da janela
- **Protocolo ativo:** cards das 5 regiões com preview e reenvio antes de fechar o envio
- **Histórico:** timeline M0 → M12; fotos só das próprias janelas
- **Feedback do Dr.:** texto liberado + selo de data da análise
- **Checklist pós-operatório:** itens dos primeiros dias/semanas (ex.: 48h de cuidado, higiene, restrições) — read-only ou com “confirmo que li”
- **Dados pessoais:** telefone, e-mail; troca de senha
- **LGPD:** consentimento explícito de armazenamento das fotos (obrigatório no 1º login)

### 3.7 Painel admin (`/admin`)

- **Dashboard clínico**
  - Pacientes com checkpoint “enviado” aguardando análise
  - Atrasados
  - Próximas janelas (7 dias)
- **Gestão de pacientes**
  - Cadastro: nome, contato, data da cirurgia, técnica, notas internas, senha temporária / magic link
  - Ativar/desativar acesso
- **Sala de análise (peça central)**
  - Grade 5 regiões do checkpoint atual
  - **Comparador temporal:** mesma região em M0 | M3 | M6 | M9 | M12 lado a lado
  - Zoom, fullscreen
  - Nota clínica **privada** (só equipe)
  - Feedback **visível ao paciente**
  - Escala rápida: densidade percebida / naturalidade / satisfação clínica (1–5)
  - Marcar “análise concluída”
- **Exportações (fase 2):** PDF do relatório anual do paciente

### 3.8 Aprimoramentos já incorporados à ideia original

| # | Aprimoramento | Por quê |
|---|---------------|---------|
| 1 | Baseline M0 + M3/M6/M9/M12 | Comparação real, não só “fotos soltas” |
| 2 | Overlay/guia por região | Padroniza ângulo e qualidade |
| 3 | Janela ± e status ATRASADO | Disciplina o calendário clínico |
| 4 | Comparador por região no tempo | Acelera a análise do médico |
| 5 | Nota privada vs feedback paciente | Ética + comunicação humanizada |
| 6 | Escalas clínicas rápidas | Dados objetivos entre períodos |
| 7 | Dashboard de fila de análise | O médico prioriza o que chegou |
| 8 | Lembretes (WhatsApp/e-mail) | Reduz abandono do acompanhamento |
| 9 | Checklist 48h / pós-op no app | Liga marca “cuidado” ao produto digital |
| 10 | Papel Assistente | Escala atendimento sem abrir laudos |
| 11 | Storage privado + auditoria | LGPD / material sensível de saúde |
| 12 | Consentimento no 1º acesso | Base legal clara |

### 3.9 Modelo de dados (rascunho)

```text
User (id, email, role: ADMIN | ASSISTENTE | PACIENTE, passwordHash, ...)
PatientProfile (userId, fullName, phone, surgeryDate, technique, crmNotes, active)
Checkpoint (id, patientId, type: M0|M3|M6|M9|M12, dueDate, windowStart, windowEnd, status)
Photo (id, checkpointId, region: FRONTAL|VERTEX|CROWN|TEMPORAL_L|TEMPORAL_R, storageKey, uploadedAt)
ClinicalReview (id, checkpointId, privateNotes, patientFeedback, scores, reviewedAt, reviewerId)
Consent (userId, type, acceptedAt, version)
AuditLog (actorId, action, resource, at)
```

### 3.10 Segurança e LGPD (mínimo obrigatório)

- Fotos **nunca** em pasta pública (`/public`)
- URLs assinadas com expiração curta
- Isolamento por `patientId` nas queries (paciente só vê o próprio)
- Log de quem visualizou/analisou
- Política de privacidade + termo de uso do portal
- Backup e retenção documentados (definir prazo com o Dr. — pendente)

---

## 4. Site institucional — estrutura

### Páginas / seções

1. Header fixo + CTA “Agende sua avaliação”
2. Hero full-bleed (marca forte, 1 headline, 1 apoio, CTA dourado)
3. Sobre o Dr. Francisco (Arapey no corpo)
4. Ciência · Arte · Cuidado
5. Tratamentos (técnicas, avaliação, pós-op / câmara hiperbárica)
6. Resultados / antes e depois
7. Depoimentos
8. Jornada do paciente (timeline, 48h)
9. FAQ
10. Contato (form → WhatsApp + e-mail)
11. Footer (logo negativa)

**CTA secundário futuro:** “Já sou paciente — acessar acompanhamento” → `/paciente/login`

### Identidade visual (resumo)

Ver briefing completo nas conversas iniciais. Paleta hex obrigatória; dourado não em texto pequeno sobre branco (contraste AA).

---

## 5. Fases de entrega

| Fase | Escopo | Status |
|------|--------|--------|
| **F0** | MAPA DE BORDO + decisões + branch | Concluída |
| **F1** | Site institucional MVP (público, SEO, contato WhatsApp) | Em andamento |
| **F2** | Auth + Admin CRUD pacientes + Paciente upload 5 fotos / checkpoints | Pendente (protótipo UI criado) |
| **F3** | Sala de análise + comparador + feedback + dashboard fila | Pendente (wireframe UI criado) |
| **F4** | Lembretes WhatsApp/e-mail, assistente, PDF, quiz lead, blog | Pendente |

---

## 6. Feito

- [x] Briefing de marca e estrutura institucional recebido
- [x] Stack definida: Next.js (sem WordPress)
- [x] SEO local: Fortaleza e Ceará
- [x] Conceito de **área do cliente** (admin + paciente) especificado e aprimorado neste mapa
- [x] Protocolo de 5 fotos × checkpoints M0–M12 documentado
- [x] Branch `cursor/site-institucional-mapa-bordo-e94e` criada
- [x] Scaffold Next.js + Tailwind + tokens CSS da marca (`globals.css`)
- [x] Tipografia: Poppins, Bebas Neue, Arapey, Great Vibes
- [x] Header / Hero / Footer + seções da home (estrutura)
- [x] Página `/contato` com formulário → WhatsApp
- [x] Protótipo `/paciente/login` + `/paciente` (timeline + upload 5 regiões)
- [x] Protótipo `/admin/login` + `/admin` (fila + wireframe sala de análise)
- [x] Links “Área do paciente” / admin no header e footer
- [x] Pasta de upload do cliente: `conteudos-para-o-site/` (marca, fotos, vídeos, textos, depoimentos)
- [x] Ícone do site: símbolo pincelada (favicon SVG/PNG + header/footer)
- [x] Pacote A — motion cinematográfico (hero, pilares, jornada)
- [x] Pacote C — folículo 3D procedural em Tratamentos (R3F, lazy + fallback)

---

## 7. Pendente

### Site (F1)

- [ ] Conteúdo da pasta `conteudos-para-o-site/` — **aguardando upload do cliente**
- [ ] Se o PNG/SVG original do símbolo for enviado em alta resolução, substituir a versão em `public/brand/`
- [ ] Assets reais no `public/` (logo completa com texto, fotos, vídeo)
- [ ] Bio, textos finais, CRM, endereço físico do consultório
- [ ] Polir seções (resultados, depoimentos) com conteúdo real
- [ ] Schema MedicalBusiness / Physician / FAQPage
- [ ] Botão flutuante WhatsApp
- [ ] LGPD página pública + cookie mínimo se necessário
- [ ] Remover SVGs padrão do create-next-app em `public/`

### Portal (F2–F3)

- [ ] Modelagem Prisma + Postgres
- [ ] Auth (NextAuth/Auth.js ou similar) com roles ADMIN / PACIENTE (/ ASSISTENTE)
- [ ] Cadastro de paciente pelo admin + primeiro acesso
- [ ] Upload seguro das 5 regiões com guias (overlay)
- [ ] Motor de checkpoints / janelas (−7 / +14 dias)
- [ ] Sala de análise + comparador temporal funcional
- [ ] Feedback liberado ao paciente + escalas 1–5
- [ ] Dashboard de fila / atrasados com dados reais
- [ ] Termos e consentimento LGPD do portal
- [ ] Definir prazo de retenção das fotos com o Dr.
- [ ] Proteger rotas `/admin` e `/paciente` (hoje só protótipo aberto)

### Conteúdo / negócio (depende do cliente)

- [ ] Preencher `conteudos-para-o-site/` (ver README e CHECKLIST-UPLOAD na pasta)
- [ ] Logo vetorial / PNG alta (positiva e negativa)
- [ ] Fotos e vídeo do Dr. e da clínica
- [ ] Casos antes/depois com consentimento publicado
- [ ] Número CRM e sociedades
- [ ] Endereço(s) em Fortaleza / Ceará
- [ ] Confirmar se baseline M0 é no dia da cirurgia ou 1ª revisão
- [ ] Credenciais do storage (R2/S3) e banco Postgres para produção

---

## 8. Ideias sugeridas (backlog)

### Alta prioridade

- [x] Link “Área do paciente” no header/footer *(feito no protótipo)*
- Botão flutuante WhatsApp no site (mensagem por página)
- Slider antes/depois no site público
- Lembrete automático na abertura da janela (WhatsApp Business API ou e-mail)
- Nota de satisfação do **paciente** (1–5) em cada checkpoint, além da escala do médico
- Notificação push/e-mail quando o Dr. liberar feedback

### Média

- Quiz “É candidato a transplante?” → lead WhatsApp
- Blog SEO (queda, FUE, mitos, pós-op)
- Vídeo curto no hero/sobre
- Relatório PDF anual
- Papel Assistente
- Mapa / unidades Fortaleza + atendimento interior do Ceará
- Motivo gráfico dupla hélice / pincelada (loading, divisores)
- Modo “revisão com paciente” (tela espelhada na consulta)

### Baixa / futuro

- Teleconsulta / fluxo “moro em outra cidade do Ceará”
- Integração Google Business / reviews
- App PWA com atalho “enviar fotos do checkpoint”
- Detecção simples de qualidade da foto (borrado / muito escuro) antes do upload
- Consentimento opcional “autorizo uso anonimizado em portfólio” (separado do uso clínico)
- Idioma espanhol

---

## 9. Diario de bordo (changelog)

| Data | Entrada |
|------|---------|
| 2026-07-14 | Criação do MAPA DE BORDO. Decisões: Next.js, Fortaleza/Ceará, sem WordPress. Portal admin+paciente especificado com protocolo 5 fotos, M0–M12, comparador, feedback, LGPD. |
| 2026-07-14 | Aprimoramento da área do cliente: papéis, fluxo de status, janelas, sala de análise, segurança. Scaffold Next.js + UI do site + protótipos `/admin` e `/paciente`. |
| 2026-07-14 | Criada pasta `conteudos-para-o-site/` para o cliente enviar marca, fotos, vídeos e textos. |
| 2026-07-15 | Branch do projeto integrada na `main` (fast-forward) e push em `origin/main`. |
| 2026-07-15 | Ocultado badge das Next.js Dev Tools via `devIndicators: false` no `next.config.ts`. |
| 2026-07-15 | Ícone da marca (símbolo pincelada) aplicado como favicon, apple-icon, header e footer. Arquivos em `public/brand/` e `conteudos-para-o-site/01-marca/`. |
| 2026-07-15 | Ícone trocado pela versão oficial enviada (PNG pincelada + hélice azul); favicon via `src/app/icon.png`. |
| 2026-07-15 | Header: menos padding/gap e remoção de `truncate` para exibir nome e tagline completos. |
| 2026-07-15 | Header sempre com `bg-black/95` (sem variante transparente) para leitura do menu. |
| 2026-07-15 | Header: efeito transparente de volta só na home; nas rotas claras (ex. `/paciente/login`) fica sólido. Login do paciente com contraste reforçado. |
| 2026-07-15 | Paleta: menos preto puro; superfícies escuras em azul-marinho `#39426b` + azuis claros. Manual resumido em `conteudos-para-o-site/08-documentos/`. |
| 2026-07-15 | Paleta refinada: removidos `#82c4d1` `#a5e1ed` `#c2dadf` das superfícies; prioridade preto/cinza/navy/`#96a4c9`/`#c7ccdb`/`#dcdfe6` + dourado. |
| 2026-07-15 | Azuis claros de apoio (`#96a4c9` etc.) trocados por navy `#39426b` em hero, seções soft e formulários. |
| 2026-07-15 | Navy de superfície escurecido: `#1a2035` (manual `#39426b` ficou claro demais na tela). |
| 2026-07-15 | Remoção de degradês. Sistema premium de planos sólidos: ink `#000`, navy `#1a2035`, quiet `#ededed`, gold CTA. |
| 2026-07-15 | Correção “tudo branco”: conflito de `--color-*` no CSS; hero volta a `bg-black` e tokens `--ff-*` / `@theme` com hex literais. |
| 2026-07-15 | Restaurado degradê do hero (preto → navy `#1a2035` → charcoal), mantendo base `bg-black` estável. |
| 2026-07-15 | Foto de cirurgia posicionada em full-bleed no início da seção Tratamentos (`/media/cirurgia-procedimento.jpg`). |
| 2026-07-15 | Retrato do Dr. no hero (`/media/dr-francisco-retrato-hero.jpg`) full-bleed à direita, com overlay escuro à esquerda para a marca. |
| 2026-07-15 | Nota: anexos do chat não chegam como arquivo no disco — fotos reais devem ir em `conteudos-para-o-site/02-fotos-medico/` (ver LEIA-ME). |
| 2026-07-15 | Retrato oficial do Dr. aplicado no hero: `dr-francisco-retrato-hero.png` (upload do cliente via GitHub). |
| 2026-07-15 | Hero atualizado para `dr-francisco-retrato-hero2.png` (novo upload do cliente). |
| 2026-07-15 | Hero voltou para `dr-francisco-retrato-hero.png` (retrato anterior). |
| 2026-07-15 | Teste hero3 (`dr-francisco-retrato-hero3.png`) ancorado à direita do `#inicio`. |
| 2026-07-15 | Pacote A (motion) entregue. Pacote C: spec + plano do folículo 3D em Tratamentos (`docs/superpowers/...pacote-c-follicle-3d*`). |
| 2026-07-15 | Pacote C entregue: folículo 3D procedural (R3F) na seção Tratamentos, lazy load + fallback PNG. |
| 2026-07-16 | Simulador de densidade: cabeça calva + 0 / 1.000 / 5.000 / máx. ~8.000 enxertos (instanced). |
| 2026-07-16 | Realismo PBR: pele MeshPhysical (SSS leve), sombra área doadora, pontilhado cirúrgico, texturas canvas. |
| 2026-07-16 | Cabeça real GLB (Lee Perry-Smith, CC BY 3.0) + pele PBR/SSS; fios via MeshSurfaceSampler na superfície real (doador fixo + receptor por densidade). |

---

## 10. Como atualizar este arquivo

1. Ao **concluir** tarefa → mover/checar em **Feito** e linha no **Diário**.
2. Ao **descobrir** trabalho novo → **Pendente**.
3. Ao **sugerir** melhoria → **Ideias** (com prioridade).
4. Ao **mudar** decisão técnica → atualizar §2 e registrar no diário o motivo.
