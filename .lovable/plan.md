

User quer um formulário **separado** baseado no mindmap do MindMeister, não fundir com o Floor Diagnostic atual. Vou criar uma nova rota dedicada que segue exatamente a estrutura visual do mindmap original.

**Nome:** `AXO Project Wizard` na rota `/project-wizard`

**Estrutura do formulário (4 steps, conforme mindmap):**

```text
Step 1: Service Type
  ├─ Refinishing
  ├─ New Installation
  └─ Repair/Other

Step 2A (Refinishing path):
  ├─ Floor Area (sqft)
  ├─ Wood Species (Oak, Maple, Pine, Other)
  ├─ Current Condition (Good, Worn, Damaged)
  └─ Color Change Intent (Same, Lighter, Darker → linka Stain Gallery)

Step 2B (New Installation path):
  ├─ Floor Area (sqft)
  ├─ Material Type (Hardwood, Engineered, Laminate, Vinyl)
  ├─ Subfloor Ready? (Yes/No/Not sure)
  └─ Budget Range ($3.5k-$7k, $7k-$15k, $15k+)

Step 2C (Repair path):
  ├─ Issue Description (textarea)
  ├─ Affected Area (small/medium/large)
  └─ Photos (optional upload)

Step 3: Property & Timeline
  ├─ Property Type (House, Condo, Commercial)
  ├─ Project Address (Google Places autocomplete)
  └─ Timeline (ASAP, 1 month, 1-3 months, planning)

Step 4: Contact & Submit
  ├─ Name, Email, Phone
  └─ Submit → leads table + Notion sync + follow-up email
```

**Diferenças vs Floor Diagnostic atual:**
- Floor Diagnostic = funil de qualificação/disqualificação ($1.8k+ refinish, $3.5k+ install) com tela de rejeição
- Project Wizard = formulário consultivo completo, captura todos os dados sem rejeitar (qualifica internamente via lead score/notes)

**Implementação:**
1. Criar `src/pages/ProjectWizard.tsx` (componente novo, isolado)
2. Adicionar rota `/project-wizard` em `src/App.tsx`
3. Reutilizar: `AddressAutocomplete`, `validateField`, `sanitizeInput`, schema Supabase `leads`
4. Salvar campos extras (wood species, color intent, material type, etc.) em `notes` JSON estruturado para preservar dados sem alterar schema
5. Integração com Notion via edge function `send-to-notion` já existente
6. Email de follow-up via `send-follow-up`

**O que NÃO faço:**
- Não toco no Floor Diagnostic (continua existindo paralelamente)
- Não crio nova tabela Supabase (uso `leads` existente)
- Não adiciono link no Header (você decide onde linkar depois)
- Sem dark mode (segue padrão das páginas públicas)

**Linguagem:** Inglês (público americano, conforme constraint do projeto).

**Design:** Light mode, Navy/Gold AXO brand, mobile-first 430px, progress indicator no topo, cards selecionáveis grandes (touch-friendly).

