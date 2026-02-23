import { useState, useEffect } from 'react';
import { Camera, Check, X, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useJobProof, JobProof, ProofValidation } from '@/hooks/useJobProof';

interface JobProofUploaderProps {
  projectId: string;
  onValidationChange?: (validation: ProofValidation) => void;
}

export const JobProofUploader = ({ projectId, onValidationChange }: JobProofUploaderProps) => {
  const [proofs, setProofs] = useState<JobProof[]>([]);
  const [validation, setValidation] = useState<ProofValidation | null>(null);
  const { fetchProofs, validateCompletion, uploadImage, addProof, isUploading } = useJobProof(projectId);

  const loadData = async () => {
    const [proofsData, validationData] = await Promise.all([
      fetchProofs(),
      validateCompletion()
    ]);
    setProofs(proofsData);
    setValidation(validationData);
    onValidationChange?.(validationData);
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'before' | 'after'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file, type);
    if (!url) return;

    if (type === 'before') {
      await addProof(url, null);
    } else {
      await addProof(null, url);
    }

    await loadData();
  };

  const beforeImages = proofs.filter(p => p.before_image_url);
  const afterImages = proofs.filter(p => p.after_image_url);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4" />
          JobProof — Obrigatorio antes de concluir
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
                    Pronto para completar projeto
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-400">
                    Requisitos pendentes
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-2">
              <Badge variant={validation.has_before_image ? 'default' : 'outline'} className="text-xs">
                {validation.has_before_image ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                Before
              </Badge>
              <Badge variant={validation.has_after_image ? 'default' : 'outline'} className="text-xs">
                {validation.has_after_image ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                After
              </Badge>
            </div>
          </div>
        )}

        {/* Upload Sections */}
        <div className="grid grid-cols-2 gap-4">
          {/* Before Images */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Before ({beforeImages.length})</h4>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">
                {isUploading ? 'Enviando...' : 'Registrar foto Before'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'before')}
                disabled={isUploading}
              />
            </label>
            {beforeImages.map((proof) => (
              <div key={proof.id} className="relative aspect-video">
                <img
                  src={proof.before_image_url!}
                  alt="Before"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>

          {/* After Images */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">After ({afterImages.length})</h4>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">
                {isUploading ? 'Enviando...' : 'Registrar foto After'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'after')}
                disabled={isUploading}
              />
            </label>
            {afterImages.map((proof) => (
              <div key={proof.id} className="relative aspect-video">
                <img
                  src={proof.after_image_url!}
                  alt="After"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
