import { useState, useEffect, useRef } from 'react';
import { Camera, Check, X, Upload, AlertTriangle, Palette, Video, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobProof, JobProof, ProofValidation } from '@/hooks/useJobProof';
import { supabase } from '@/integrations/supabase/client';
import { STAIN_COLORS, WOOD_SPECIES } from '@/lib/stainColors';

interface JobProofUploaderProps {
  projectId: string;
  onValidationChange?: (validation: ProofValidation) => void;
}

interface ProofMetadata {
  proofId: string;
  phase: 'before' | 'after';
  stain_color?: string;
  wood_species?: string;
}

export const JobProofUploader = ({ projectId, onValidationChange }: JobProofUploaderProps) => {
  const [proofs, setProofs] = useState<JobProof[]>([]);
  const [validation, setValidation] = useState<ProofValidation | null>(null);
  const [metadataMap, setMetadataMap] = useState<Record<string, { stain_color?: string; wood_species?: string; media_type?: string }>>({});
  const { fetchProofs, validateCompletion, uploadImage, addProof, isUploading } = useJobProof(projectId);

  // Pending file flow (mini-form before submit)
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingType, setPendingType] = useState<'before' | 'after' | null>(null);
  const [stainColor, setStainColor] = useState<string>('');
  const [woodSpecies, setWoodSpecies] = useState<string>('');
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m4v|avi|qt)(\?|$)/i.test(url);

  const loadData = async () => {
    const [proofsData, validationData] = await Promise.all([
      fetchProofs(),
      validateCompletion()
    ]);
    setProofs(proofsData);
    setValidation(validationData);
    onValidationChange?.(validationData);

    // Pull stain/wood metadata from media_files for thumbnails
    const { data: media } = await supabase
      .from('media_files')
      .select('storage_path, metadata, created_at')
      .eq('project_id', projectId)
      .eq('folder_type', 'before_after')
      .order('created_at', { ascending: false });

    if (media) {
      const map: Record<string, { stain_color?: string; wood_species?: string }> = {};
      media.forEach((m) => {
        const md = m.metadata as any;
        if (md?.stain_color || md?.wood_species) {
          // Key by created_at minute (rough match with proof rows)
          const key = `${md.phase || ''}-${new Date(m.created_at).getTime()}`;
          map[key] = { stain_color: md.stain_color, wood_species: md.wood_species };
        }
      });
      setMetadataMap(map);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'before' | 'after'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingType(type);
    setStainColor('');
    setWoodSpecies('');
    // reset input so same file can be reselected
    event.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile || !pendingType) return;

    const result = await uploadImage(pendingFile, pendingType, {
      stain_color: stainColor || undefined,
      wood_species: woodSpecies || undefined,
    });

    if (!result) {
      closeDialog();
      return;
    }

    if (pendingType === 'before') {
      await addProof(result.url, null);
    } else {
      await addProof(null, result.url);
    }

    closeDialog();
    await loadData();
  };

  const closeDialog = () => {
    setPendingFile(null);
    setPendingType(null);
    setStainColor('');
    setWoodSpecies('');
  };

  const beforeImages = proofs.filter(p => p.before_image_url);
  const afterImages = proofs.filter(p => p.after_image_url);

  // Match a proof to its closest metadata entry by phase + nearby timestamp
  const findMetadata = (phase: 'before' | 'after', createdAt: string) => {
    const target = new Date(createdAt).getTime();
    const candidates = Object.entries(metadataMap)
      .filter(([key]) => key.startsWith(`${phase}-`))
      .map(([key, value]) => ({
        ts: parseInt(key.split('-')[1], 10),
        value,
      }))
      .filter(c => Math.abs(c.ts - target) < 60_000); // within 60s
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => Math.abs(a.ts - target) - Math.abs(b.ts - target));
    return candidates[0].value;
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            JobProof — After obrigatório · Before opcional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation Status */}
          {validation && (
            <div className={`p-3 rounded-lg border ${
              validation.can_complete
                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                : 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                {validation.can_complete ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 dark:text-green-400">
                      {validation.has_before_image
                        ? 'Pronto: Before + After ok'
                        : 'Pronto para concluir (sem Before)'}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-700 dark:text-amber-400">
                      Falta foto AFTER para concluir
                    </span>
                  </>
                )}
              </div>
              <div className="flex gap-3 mt-2">
                <Badge variant={validation.has_before_image ? 'default' : 'outline'} className="text-xs">
                  {validation.has_before_image ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                  Before <span className="ml-1 opacity-60">(opcional)</span>
                </Badge>
                <Badge variant={validation.has_after_image ? 'default' : 'destructive'} className="text-xs">
                  {validation.has_after_image ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                  After <span className="ml-1 opacity-80">(obrigatório)</span>
                </Badge>
              </div>
            </div>
          )}

          {/* Upload Sections */}
          <div className="grid grid-cols-2 gap-4">
            {/* Before Media */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1.5">Before ({beforeImages.length}) <span className="text-[10px] font-normal text-muted-foreground">opcional</span></h4>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground text-center">
                  {isUploading ? 'Enviando...' : 'Adicionar Before'}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mt-1">
                  <Camera className="h-3 w-3" /> foto
                  <span className="opacity-50">·</span>
                  <Video className="h-3 w-3" /> vídeo
                </span>
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'before')}
                  disabled={isUploading}
                />
              </label>
              {beforeImages.map((proof) => {
                const meta = findMetadata('before', proof.created_at);
                const url = proof.before_image_url!;
                const video = isVideoUrl(url);
                return (
                  <div key={proof.id} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {video ? (
                      <>
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                        />
                        <Badge className="absolute top-1 right-1 text-[10px] bg-background/90 text-foreground border gap-0.5">
                          <Video className="h-2.5 w-2.5" /> Video
                        </Badge>
                      </>
                    ) : (
                      <img src={url} alt="Before" className="w-full h-full object-cover" />
                    )}
                    {meta && (meta.stain_color || meta.wood_species) && (
                      <Badge className="absolute bottom-1 left-1 text-[10px] bg-background/90 text-foreground border">
                        {[meta.stain_color, meta.wood_species].filter(Boolean).join(' · ')}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* After Media */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">After ({afterImages.length})</h4>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground text-center">
                  {isUploading ? 'Enviando...' : 'Adicionar After'}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mt-1">
                  <Camera className="h-3 w-3" /> foto
                  <span className="opacity-50">·</span>
                  <Video className="h-3 w-3" /> vídeo
                </span>
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'after')}
                  disabled={isUploading}
                />
              </label>
              {afterImages.map((proof) => {
                const meta = findMetadata('after', proof.created_at);
                const url = proof.after_image_url!;
                const video = isVideoUrl(url);
                return (
                  <div key={proof.id} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {video ? (
                      <>
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                        />
                        <Badge className="absolute top-1 right-1 text-[10px] bg-background/90 text-foreground border gap-0.5">
                          <Video className="h-2.5 w-2.5" /> Video
                        </Badge>
                      </>
                    ) : (
                      <img src={url} alt="After" className="w-full h-full object-cover" />
                    )}
                    {meta && (meta.stain_color || meta.wood_species) && (
                      <Badge className="absolute bottom-1 left-1 text-[10px] bg-background/90 text-foreground border">
                        <Palette className="h-2.5 w-2.5 mr-1" />
                        {[meta.stain_color, meta.wood_species].filter(Boolean).join(' · ')}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini-form metadata dialog */}
      <Dialog open={!!pendingFile} onOpenChange={(open) => !open && !isUploading && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Detalhes da foto {pendingType === 'after' ? 'After' : 'Before'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Catalogue a foto para futuras buscas e galeria de cores. Campos opcionais.
            </p>

            <div className="space-y-2">
              <Label htmlFor="stain-color">Stain Color (DuraSeal)</Label>
              <Select value={stainColor} onValueChange={setStainColor}>
                <SelectTrigger id="stain-color">
                  <SelectValue placeholder="Selecione a cor (opcional)" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {STAIN_COLORS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wood-species">Wood Species</Label>
              <Select value={woodSpecies} onValueChange={setWoodSpecies}>
                <SelectTrigger id="wood-species">
                  <SelectValue placeholder="Selecione a madeira (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {WOOD_SPECIES.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDialog} disabled={isUploading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmUpload} disabled={isUploading}>
              {isUploading ? 'Enviando...' : 'Salvar foto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
