

## Plano: Tornar o AXO Master System Editável (Mindmap Flexível)

### Problema Atual
O arquivo `public/axo-master-system.html` é um HTML estático com ~1345 linhas. Posições dos nodes são hardcoded em `style="top:Xpx;left:Ypx"`, e o conteúdo está embutido em um objeto `DATA` JavaScript. Para mudar qualquer texto ou adicionar um node, é preciso editar HTML + JS + recalcular posições manualmente.

### Solução
Converter para uma **página React** com dados estruturados em arrays JSON. Isso permite:
- **Editar textos** facilmente (basta mudar strings no array de dados)
- **Adicionar/remover nodes** sem recalcular layout — usar layout automático (grid/radial)
- **Manter o visual atual** (dark theme, IBM Plex, cores gold/pine/violet/etc)

### Estrutura Proposta

**Arquivo de dados**: `src/data/axoMasterSystem.ts`
- Exporta os 4 tabs com seus nodes e conexões como arrays tipados
- Cada node: `{ id, label, tag, subtitle, color, details }`
- Cada conexão: `{ from, to }`
- Adicionar um novo node = adicionar um objeto ao array

**Página React**: Reescrever `src/pages/AxoMasterSystem.tsx`
- 4 tabs com o mesmo visual atual
- Nodes renderizados dinamicamente a partir dos dados
- Layout automático (radial para Tab 1, horizontal flow para Tabs 2-4)
- Panel/sheet ao clicar em um node mostra os detalhes
- SVG arrows calculadas automaticamente entre nodes conectados

**Rota**: Mantém `/axo-master-system` — sem mudança

### O Que Muda para Você
- Para **editar textos**: abre `src/data/axoMasterSystem.ts`, muda as strings
- Para **adicionar um node**: adiciona um objeto no array do tab desejado + uma conexão
- Para **remover**: deleta o objeto do array
- Me pede para fazer qualquer uma dessas mudanças por chat

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/data/axoMasterSystem.ts` | **Criar** — dados estruturados dos 4 tabs |
| `src/pages/AxoMasterSystem.tsx` | **Reescrever** — de iframe para React completo |
| `public/axo-master-system.html` | **Manter** como fallback (não deletar) |

### Escopo
~700 linhas total entre os 2 arquivos novos. Visual idêntico ao atual.

