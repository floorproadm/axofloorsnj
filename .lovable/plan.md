

## Plano: Corrigir Suporte a Video no Feed

### Problema Diagnosticado
Os 2 videos deste post estao armazenados como `.MOV` (HEVC do iPhone). A transcodificacao client-side via ffmpeg.wasm **falhou silenciosamente** e o codigo de fallback enviou os arquivos originais `.MOV` sem conversao. Chrome e Firefox nao conseguem reproduzir HEVC/MOV, resultando no erro "Formato nao suportado".

### Causa Raiz
O ffmpeg.wasm e instavel no browser: requer ~25MB de download, SharedArrayBuffer, e frequentemente falha em mobile. O fallback atual envia o arquivo original quando a transcodificacao falha, criando exatamente o problema que deveria resolver.

### Solucao: Abordagem em 3 Partes

#### Parte 1 - Bloquear uploads incompativeis (prevencao)
- Modificar `FeedPostForm.tsx` para **rejeitar** arquivos `.MOV/.AVI/.WMV/.MKV` com mensagem clara pedindo formato MP4
- Remover o fallback que envia o arquivo original quando a transcodificacao falha
- Aceitar apenas: `video/mp4`, `video/webm`, `video/ogg` + todos os formatos de imagem

#### Parte 2 - Manter transcodificacao como tentativa opcional
- Manter o `videoTranscoder.ts` mas **nao enviar o arquivo original se falhar**
- Se a transcodificacao funcionar (desktop com boa memoria), otimo - o video e convertido
- Se falhar, mostrar erro claro: "Este formato de video nao e suportado. Por favor, converta para MP4 antes de enviar."
- Adicionar timeout de 60 segundos para evitar travamento

#### Parte 3 - Corrigir os videos existentes
- Criar uma funcao no `FeedPostDetail` e `FeedImageCarousel` que detecta `.MOV` na URL e oferece opcao de **re-upload em MP4**
- Para os videos ja enviados em `.MOV`, manter o fallback de download mas melhorar a UX com instrucoes claras

### Mudancas Tecnicas

**`src/components/admin/feed/FeedPostForm.tsx`**:
- `handleFileSelect`: Rejeitar formatos incompativeis em vez de tentar transcodificar e falhar silenciosamente
- Mostrar toast de erro especifico com instrucao para converter para MP4
- Adicionar timeout no transcoding para nao travar

**`src/utils/videoTranscoder.ts`**:
- Adicionar timeout de 60s
- Nao retornar fallback - lancar erro se falhar

**`src/components/shared/MediaRenderer.tsx`**:
- Melhorar fallback para videos `.MOV` com instrucoes mais claras
- Adicionar botao "Re-enviar em MP4" quando em contexto admin

**`src/components/admin/feed/FeedImageCarousel.tsx`**:
- Melhorar UX do fallback de video com instrucoes de re-upload

### Resultado Esperado
- Novos uploads: apenas formatos compativeis (MP4/WebM) sao aceitos
- Tentativa de transcodificacao automatica, mas sem fallback silencioso
- Videos existentes em `.MOV`: fallback com download + instrucoes claras
- Zero videos "quebrados" no futuro

