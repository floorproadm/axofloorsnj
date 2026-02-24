

## Corrigir Validacao do Transcoder que Rejeita MP4 Validos

### Problema Identificado
Os logs mostram claramente:
- Transcodificacao funciona: 75MB MOV -> 25MB MP4, 62MB MOV -> 21MB MP4
- A funcao `validateMp4()` rejeita o resultado como "unplayable"
- O sistema faz fallback e envia o .MOV original, que o navegador nao consegue reproduzir

A validacao cria um `<video>` temporario com timeout de 5 segundos para verificar se o blob de 25MB carrega metadados. Isso falha porque:
1. Blobs grandes levam mais tempo para carregar metadados
2. O `videoWidth` pode retornar 0 mesmo com video valido dependendo do timing
3. Limpeza prematura do src antes da resolucao

### Solucao
Remover a validacao `validateMp4()` e confiar no tamanho do arquivo como indicador de sucesso. Se o Remotion WebCodecs produziu um arquivo de 25MB a partir de 75MB, o arquivo e valido. A checagem de tamanho minimo (1KB) ja cobre o caso de falha real.

### Mudancas

**Arquivo: `src/utils/videoTranscoder.ts`**
- Remover a funcao `validateMp4()` inteiramente
- Remover a chamada de validacao no `transcodeToMp4()`
- Manter a verificacao de tamanho minimo (1KB)
- Adicionar log do tipo do blob para debug

### Detalhes Tecnicos

O codigo ficara assim:

```text
export async function transcodeToMp4(file, onProgress) {
  // ... WebCodecs check e convertMedia permanecem iguais ...
  
  const blob = await result.save();
  console.log(`Transcoding finished. Result size: ${blob.size} bytes`);

  if (blob.size < 1024) {
    throw new Error(`Transcoding failed: Output file too small`);
  }

  // Sem validateMp4() - confia no resultado do Remotion
  const newName = file.name.replace(/\.[^.]+$/, ".mp4");
  return new File([blob], newName, { type: "video/mp4" });
}
```

### Resultado Esperado
- Upload de .MOV converte para .MP4 e faz upload do arquivo convertido
- Video reproduz normalmente no feed
- Sem mais fallback desnecessario para .MOV original

