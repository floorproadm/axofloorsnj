
## Correcao Definitiva: Video .MOV com Transcoding Nativo do Navegador

### Problema
O FFmpeg WASM (25MB de download, requer SharedArrayBuffer) falha silenciosamente e envia o .MOV original, que Chrome/Firefox nao conseguem reproduzir.

### Solucao: Substituir FFmpeg WASM por @remotion/webcodecs

A biblioteca `@remotion/webcodecs` usa a **API WebCodecs nativa do navegador** para converter videos. Vantagens:

- Zero download de WASM (usa decoders nativos do browser)
- Acelerado por hardware (GPU)
- Suporta .MOV como input, .MP4 (H.264 + AAC) como output
- Muito mais rapido e confiavel que FFmpeg WASM

### Mudancas

#### 1. Instalar dependencias
- Adicionar `@remotion/webcodecs` e `@remotion/media-parser`
- Remover `@ffmpeg/ffmpeg` e `@ffmpeg/util` (nao serao mais usados)

#### 2. Reescrever `src/utils/videoTranscoder.ts`
- Substituir toda a logica FFmpeg por `convertMedia()` do `@remotion/webcodecs`
- `needsTranscoding()` continua igual (detecta .mov, .avi, .wmv, .mkv)
- `transcodeToMp4()` agora usa `convertMedia({ src: blob, container: 'mp4', videoCodec: 'h264', audioCodec: 'aac' })`
- Adicionar verificacao de suporte: `typeof VideoEncoder !== 'undefined'`
- Se o browser nao suportar WebCodecs, lanca erro (fallback para upload original com aviso)

#### 3. Manter logica de upload em `FeedPostForm.tsx`
- O fluxo de upload permanece o mesmo (tentar converter, se falhar envia original com aviso)
- Timeout de 60 segundos permanece
- Progress callback via `onProgress` do `convertMedia()`

#### 4. Deletar o video .MOV quebrado restante
- Deletar o registro `41e5e2d1-1f8f-4e31-bb31-efbfb9368e5d` da tabela `feed_post_images`
- Tambem deletar o arquivo do storage

### Detalhes Tecnicos

Codigo principal do novo transcoder:

```text
import { convertMedia } from "@remotion/webcodecs";

export async function transcodeToMp4(file: File, onProgress?): Promise<File> {
  const result = await convertMedia({
    src: file,              // Blob/File input (.MOV)
    container: "mp4",       // Output container
    videoCodec: "h264",     // H.264 (universal)
    audioCodec: "aac",      // AAC audio
    onProgress: ({ percent }) => onProgress?.(percent / 100),
  });
  return new File([result], file.name.replace(/\.[^.]+$/, ".mp4"), { type: "video/mp4" });
}
```

### Compatibilidade
- Chrome 94+ (WebCodecs API)
- Edge 94+
- Firefox (suporte parcial, fallback para upload original)
- Safari (suporte parcial, fallback para upload original)
- O painel admin e usado principalmente de Chrome/Edge, onde funciona perfeitamente

### Resultado
- Upload de .MOV do iPhone funciona automaticamente
- Conversao rapida usando GPU do dispositivo
- Sem downloads pesados de WASM
- Fallback seguro para browsers sem WebCodecs
