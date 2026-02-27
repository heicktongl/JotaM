import React, { useRef, useState, useEffect } from 'react';
import { Camera, Loader2, Check, X as XIcon, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface AvatarUploaderProps {
  currentUrl: string | null;
  fallbackUrl: string;
  onUploadSuccess: (url: string | null) => void;
  uid: string;
  bucket?: string;
  folder?: string;
  size?: 'md' | 'lg' | 'cover'; // md: 24, lg: 32, cover: full
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentUrl,
  fallbackUrl,
  onUploadSuccess,
  uid,
  bucket = 'avatars',
  folder = 'profiles',
  size = 'md'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Limpa a URL em memória ao desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (inputRef.current) inputRef.current.value = ''; // reseta
  };

  const cancelPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const confirmUpload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!previewFile) return;

    try {
      setIsUploading(true);
      const ext = previewFile.name.split('.').pop();
      const path = `${uid}/${folder}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, previewFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      onUploadSuccess(publicUrl);

      // Reseta estado local
      setPreviewFile(null);
      setPreviewUrl(null);

      // Pequeno timeout pro React atualizar imagens em cache
      setTimeout(() => alert('A foto foi atualizada com sucesso!'), 300);

    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      alert('Não foi possível atualizar a foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm("Deseja realmente remover esta foto?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      // Remove do banco repassando null
      onUploadSuccess(null);
      alert('Foto removida com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir foto.');
    } finally {
      setIsDeleting(false);
    }
  };

  const dimensions = {
    md: 'h-24 w-24 rounded-full border-4 border-white shadow-sm',
    lg: 'h-32 w-32 rounded-full border-4 border-neutral-50 shadow-lg',
    cover: 'h-full w-full'
  };

  const activeSrc = previewUrl || currentUrl || fallbackUrl;
  const showDelete = !previewFile && currentUrl; // Só mostra deletar se n for preview e já tiver foto
  const isCover = size === 'cover';

  return (
    <div className={`relative group overflow-hidden bg-neutral-100 ${dimensions[size]}`}>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <img
        src={activeSrc}
        alt="Foto"
        className={`h-full w-full ${isDeleting ? 'opacity-50 grayscale' : ''} object-cover`}
        referrerPolicy="no-referrer"
      />

      <AnimatePresence>
        {previewFile ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-4 z-20"
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="animate-spin text-white mb-2" size={isCover ? 32 : 24} />
                {isCover && <span className="text-white font-bold text-sm">Salvando capa...</span>}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={cancelPreview}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                  title="Cancelar"
                >
                  <XIcon size={isCover ? 24 : 16} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={confirmUpload}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                  title="Salvar"
                >
                  <Check size={isCover ? 24 : 16} strokeWidth={3} />
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <div
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10"
          >
            <button
              type="button"
              onClick={() => !isDeleting && inputRef.current?.click()}
              className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-colors"
              title="Alterar imagem"
            >
              <Camera size={isCover ? 28 : 20} className="drop-shadow-md" />
            </button>

            {showDelete && (
              <button
                type="button"
                onClick={deletePhoto}
                disabled={isDeleting}
                className="bg-red-500/80 hover:bg-red-500 backdrop-blur-md text-white p-3 rounded-full transition-colors"
                title="Excluir imagem atual"
              >
                {isDeleting ? <Loader2 size={isCover ? 28 : 20} className="animate-spin" /> : <Trash2 size={isCover ? 28 : 20} />}
              </button>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
