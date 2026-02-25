

## Remover pagina /sales2026 do sistema

Todo o conteudo ja foi extraido acima em formato Markdown pronto para colar no Obsidian. Agora vamos limpar os arquivos do projeto.

### Arquivos a deletar
1. `src/pages/Sales2026.tsx` - Pagina principal
2. `src/components/sales/salesStepsData.ts` - Dados dos 10 steps
3. `src/components/sales/SalesStepPanel.tsx` - Componente do painel lateral

### Arquivo a editar
4. `src/App.tsx`:
   - Remover o import `Sales2026`
   - Remover a rota `<Route path="/sales2026" element={<Sales2026 />} />`

### Resultado
- A rota `/sales2026` deixara de existir
- Nenhum outro componente do sistema referencia esses arquivos, entao nao ha impacto colateral

