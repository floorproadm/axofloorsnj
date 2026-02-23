import { useState, useRef } from 'react';
import {
  useProjectDocuments,
  useUploadDocument,
  useDeleteDocument,
  DOCUMENT_FOLDERS,
  type DocumentFolder,
} from '@/hooks/useProjectDocuments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  Trash2,
  Download,
  FileText,
  Image,
  File,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProjectDocumentsManagerProps {
  projectId: string;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  'image/': <Image className="w-5 h-5 text-blue-500" />,
  'application/pdf': <FileText className="w-5 h-5 text-red-500" />,
  default: <File className="w-5 h-5 text-muted-foreground" />,
};

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return FILE_ICONS['image/'];
  if (fileType === 'application/pdf') return FILE_ICONS['application/pdf'];
  return FILE_ICONS.default;
}

export function ProjectDocumentsManager({ projectId }: ProjectDocumentsManagerProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [uploadFolder, setUploadFolder] = useState<DocumentFolder>('photos');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading } = useProjectDocuments(
    projectId,
    selectedFolder === 'all' ? undefined : selectedFolder
  );
  const { mutate: uploadDoc, isPending: isUploading } = useUploadDocument();
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteDocument();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      uploadDoc({ projectId, folder: uploadFolder, file });
    });
    e.target.value = '';
  };

  const folderLabel = (val: string) =>
    DOCUMENT_FOLDERS.find((f) => f.value === val)?.label ?? val;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar pasta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as pastas</SelectItem>
              {DOCUMENT_FOLDERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Upload */}
        <div className="flex items-center gap-2">
          <Select
            value={uploadFolder}
            onValueChange={(v) => setUploadFolder(v as DocumentFolder)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_FOLDERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            size="sm"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-1.5" />
            )}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum documento registrado</p>
          <p className="text-xs mt-1">Anexe contratos, medicoes ou propostas ao projeto</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b text-left">
                <th className="px-4 py-2.5 font-medium">Arquivo</th>
                <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Pasta</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Data</th>
                <th className="px-4 py-2.5 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(doc.file_type)}
                      <span className="truncate max-w-[200px] sm:max-w-[300px]">
                        {doc.file_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs">
                      {folderLabel(doc.folder)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {format(new Date(doc.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover documento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{doc.file_name}" será removido permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteDoc(doc)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
