

# Unificar Campos de Endereço com Autocomplete

## Problema
A página Job Detail tem 3 campos separados (Address, City, Zip Code) — redundante. O usuário quer um campo único com autocomplete estilo Google Places, como nos sites públicos.

## Solução

### 1. Campo único "Address" com autocomplete via Google Places API
- Remover campos separados de City e Zip Code do formulário
- Criar um componente `AddressAutocomplete` que usa a **Google Places Autocomplete API**
- Quando o usuário digita, suggestions aparecem em dropdown
- Ao selecionar, preenche automaticamente o campo `address` com endereço completo e salva `city` e `zip_code` nos campos do banco em background (parse automático dos componentes)

### 2. Configuração necessária
- Precisa de uma **Google Maps API Key** com Places API habilitada
- A key será armazenada como secret (`GOOGLE_MAPS_API_KEY`) e exposta via `VITE_GOOGLE_MAPS_API_KEY`
- Script do Google Maps carregado dinamicamente no componente

### 3. Componente `AddressAutocomplete`
- Novo arquivo: `src/components/admin/AddressAutocomplete.tsx`
- Input com autocomplete dropdown nativo do Google Places
- Restrição geográfica: US (foco em NJ)
- Ao selecionar endereço: extrai `street`, `city`, `state`, `zip` dos `address_components`
- Callback `onSelect({ full, city, zip })` permite salvar tudo de uma vez

### 4. Mudanças no JobDetail
- Substituir os 3 `EditableField` (Address, City, Zip Code) por um único `AddressAutocomplete`
- Ao selecionar endereço, salva `address` (completo), `city`, e `zip_code` automaticamente no banco
- Manter o link "Open in Google Maps"
- Manter edição manual como fallback (se digitar sem selecionar suggestion)

### 5. Reutilização
- O componente pode ser reutilizado em `NewJobDialog`, `NewLeadDialog`, formulários públicos

## Detalhes Técnicos

### Arquivos
1. `src/components/admin/AddressAutocomplete.tsx` — novo componente
2. `src/pages/admin/JobDetail.tsx` — substituir 3 campos por 1
3. Secret: `VITE_GOOGLE_MAPS_API_KEY` — precisa ser configurada

### Fluxo
```text
User types "11 Kath..."
  → Google Places suggestions dropdown
  → Seleciona "11 Katharine Pl, Washington Twp, NJ 07676"
  → Salva: address="11 Katharine Pl", city="Washington Township", zip_code="07676"
```

**Nota**: Vou precisar que você forneça uma Google Maps API Key com a Places API habilitada para o autocomplete funcionar.

