
# Redesign do PipelineCard -- Operacional First

## Resumo

Refatorar o componente `PipelineCard` em `src/pages/admin/components/LinearPipeline.tsx` para um card compacto (~110px), de alta densidade, orientado a decisao rapida. Tambem ajustar a ordenacao dentro de cada coluna para priorizar urgencia.

**Escopo**: Apenas frontend/UI. Zero mudancas em banco de dados, triggers ou RPCs.

## Arquivo Modificado

`src/pages/admin/components/LinearPipeline.tsx`

## Mudancas Detalhadas

### 1. Imports

Remover: `Button`, `LeadSignalBadge`, `ChevronRight`, `Ban`, `format`

Adicionar: `AlertTriangle`

### 2. Novo mapeamento de servicos

Adicionar constante `serviceLabels` para converter slugs em labels amigaveis:

```typescript
const serviceLabels: Record<string, string> = {
  'new-installation': 'Installation',
  'sanding': 'Sanding',
  'refinishing': 'Refinishing',
  'staining': 'Staining',
  'repair': 'Repair',
  'vinyl': 'Vinyl',
  'baseboards': 'Baseboards',
  'staircase': 'Staircase',
};
```

### 3. Helper: formatTimeInStage

Funcao que calcula o tempo no stage e retorna texto + classe de cor:

```typescript
function getTimeBadge(updatedAt: string) {
  const hours = differenceInHours(new Date(), new Date(updatedAt));
  if (hours < 24) return { text: `${hours}h`, className: 'bg-muted text-muted-foreground' };
  if (hours < 48) return { text: `${Math.round(hours)}h`, className: 'bg-amber-100 text-amber-700' };
  const days = Math.floor(hours / 24);
  return { text: `${days}d+`, className: 'bg-red-100 text-red-700 font-semibold' };
}
```

### 4. Helper: getOperationalAlert

Retorna alerta operacional condicional baseado em NRA e dados do lead:

```typescript
function getOperationalAlert(lead, nra) {
  if (nra?.severity === 'critical' || nra?.severity === 'blocked')
    return { text: nra.label, type: 'critical' };
  if (lead.follow_up_required)
    return { text: 'Follow-up obrigatorio', type: 'warning' };
  if (nra?.action && nra.action !== 'none')
    return { text: nra.label, type: 'info' };
  return null;
}
```

### 5. Novo PipelineCard -- Layout

```text
+-------------------------------------+
| [72h]  EDUARDO OLIVEIRA      $6,300 |  <- Linha 1: TimeBadge + Nome + Valor
| (phone) 555-123   (pin) Orlando [Site] | <- Linha 2: Contato rapido
| [Installation] [Sanding] +1         |  <- Linha 3: Servicos (max 2 + overflow)
| /!\ Follow-up obrigatorio           |  <- Alerta operacional (condicional)
+-------------------------------------+
```

Estrutura JSX:

- **Container**: `p-3 rounded-lg border bg-card cursor-pointer hover:shadow-md`, com ring condicional (blocked=vermelho, stale=amarelo)
- **Linha 1**: flex justify-between, align-center
  - TimeBadge (Badge compacta com cor semantica)
  - Nome (font-semibold text-xs truncate, max-w limitado)
  - Valor alinhado a direita (font-bold text-xs) ou "--" se nenhum
- **Linha 2**: flex gap-2, text-[10px]
  - Phone com icone, clicavel via `<a href="tel:...">`  com `e.stopPropagation()`
  - Cidade com icone MapPin
  - Badge fonte do lead (outline, text-[9px])
- **Linha 3**: flex gap-1, mostrar ate 2 servicos como Badge secondary + "+N" se houver mais
- **Alerta operacional** (condicional): barra fina com icone AlertTriangle, texto curto, cor semantica (amber para warning, red para critico)

### 6. Ordenacao por Urgencia

Alterar o sort dentro de `leadsByStage` de:

```typescript
// ANTES: apenas por updated_at DESC
sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
```

Para sort multi-criterio:

```typescript
// DEPOIS: urgencia primeiro, depois valor, depois criacao
sort((a, b) => {
  // 1. Tempo no stage DESC (mais antigo primeiro = mais urgente)
  const timeA = new Date(a.updated_at).getTime();
  const timeB = new Date(b.updated_at).getTime();
  if (timeA !== timeB) return timeA - timeB; // oldest first
  // 2. Valor potencial DESC
  const valA = a.budget || 0;
  const valB = b.budget || 0;
  if (valA !== valB) return valB - valA;
  // 3. created_at ASC
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
})
```

### 7. Summary Bar -- Traduzir para portugues

Trocar "Total Deals" por "Total Leads" e "Total Value" por "Valor Total" para consistencia com AXO OS em portugues.

## Resultado Visual Esperado

```text
+-------------------------------------+
| 72h   EDUARDO OLIVEIRA       $6,300 |
| tel (555) 123-4567  pin Orlando [Site]|
| [Installation] [Sanding] +1         |
| /!\ Follow-up obrigatorio           |
+-------------------------------------+
```

Card com ~110px de altura, denso, sem elementos decorativos desnecessarios. Alertas operacionais aparecem apenas quando ha problema real. Ordenacao automatica prioriza leads mais antigos no stage (urgentes) e de maior valor.
