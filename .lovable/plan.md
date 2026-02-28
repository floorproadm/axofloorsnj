

## Corrigir UI/UX de Medidas para Escadas

### Problema Atual
Quando o tipo "Escada" e selecionado na edicao de areas, a interface nao se adapta corretamente:
1. O campo "dimensoes" (ex: 20' x 20') continua aparecendo -- nao faz sentido para escadas
2. O resumo de totais so mostra "sqft" e "linear ft", ignorando a contagem de degraus
3. No card da lista e na view de detalhe, escadas nao aparecem no resumo

### Mudancas Planejadas

**Arquivo: `src/pages/admin/MeasurementsManager.tsx`**

#### 1. Edit View - Adaptar campos por tipo de area
- Quando `area_type === 'staircase'`: esconder o campo de dimensoes (20' x 20') pois nao se aplica
- Manter apenas o input numerico com label "degraus"

#### 2. Edit View - Mostrar resumo completo no header das Areas
- Atualmente: `Total: 1,350 sqft`
- Corrigido: `Total: 1,350 sqft` + `13 degraus` (quando houver escadas)
- Tambem mostrar linear ft se houver rodape/corrimao

#### 3. Detail View - Incluir degraus no resumo Total
- Na secao de totais (linha 347-353), adicionar contagem de degraus separadamente
- Ex: `1,350 sqft | 13 degraus`

#### 4. Card View (lista) - Incluir degraus no resumo
- Na linha 243-258, adicionar exibicao de degraus quando houver escadas no projeto

### Detalhes Tecnicos

- Calcular `totalStairs` (ja existe na linha 457-459) e usar nos 3 locais de resumo
- No Detail View, calcular totalStairs a partir de `m.areas`
- No Card View, nao temos `areas` -- entao precisamos de um campo ou calcular pelo que ja existe. Como o DB trigger `recalc_measurement_totals` nao salva degraus separadamente, vamos precisar calcular no detail/edit views onde temos as areas, e no card apenas manter sqft + linear ft (ja que nao temos os dados de areas no card)

**Alternativa para o Card**: podemos fazer o query de measurements trazer tambem uma contagem de degraus. Mas a solucao mais simples e mostrar os degraus apenas onde temos as areas carregadas (detail e edit views).

