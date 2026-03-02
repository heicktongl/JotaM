import React, { useRef, useState, useEffect } from 'react';
import { Camera, Loader2, Check, X as XIcon, Trash2, ImagePlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface AvatarUploaderProps {
  currentUrl: string | null;
  fallbackUrl: string;
  onUploadSuccess: (url: string | null) => void;
  uid: string;
  bucket?: string;
  folder?: string;
  size?: 'md' | 'lg' | 'cover';
  /** Quando true, desabilita toda interação (somente exibe a imagem) */
  readOnly?: boolean;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentUrl,
  fallbackUrl,
  onUploadSuccess,
  uid,
  bucket = 'avatars',
  folder = 'profiles',
  size = 'md',
  readOnly = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

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
    if (inputRef.current) inputRef.current.value = '';
  };

  const cancelPreview = () => {
    setPreviewFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const confirmUpload = async () => {
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
      setPreviewFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      alert('Não foi possível atualizar a foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async () => {
    const confirmed = window.confirm('Deseja realmente remover esta foto?');
    if (!confirmed) return;
    try {
      setIsDeleting(true);
      onUploadSuccess(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir foto.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isCover = size === 'cover';
  const activeSrc = previewUrl || currentUrl || fallbackUrl;

  // ─────────────────────────────────────────────────────────────────
  // MODO COVER (capa retangular) — mantém overlay interno (aceitável
  // para imagens retangulares; botões integrados à área da capa)
  // ─────────────────────────────────────────────────────────────────
  if (isCover) {
    return (
      <div className="relative group overflow-hidden h-full w-full bg-neutral-200">
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {activeSrc ? (
          <img
            src={activeSrc}
            alt="Capa"
            className={`h-full w-full object-cover ${isDeleting ? 'opacity-50 grayscale' : ''}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-neutral-200">
            <ImagePlus size={32} className="text-neutral-400" />
          </div>
        )}

        {!readOnly && (
          <AnimatePresence>
            {previewFile ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-4 z-20"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-white" size={28} />
                    <span className="text-white font-bold text-sm">Salvando capa...</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={cancelPreview}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold transition-transform hover:scale-105 shadow-lg"
                    >
                      <XIcon size={18} strokeWidth={3} />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmUpload}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold transition-transform hover:scale-105 shadow-lg"
                    >
                      <Check size={18} strokeWidth={3} />
                      Salvar Capa
                    </button>
                  </>
                )}
              </motion.div>
            ) : (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={() => !isDeleting && inputRef.current?.click()}
                  className="flex items-center gap-2 bg-white/90 hover:bg-white text-neutral-900 px-4 py-2 rounded-2xl shadow-lg backdrop-blur-md transition-colors font-bold text-sm"
                >
                  <Camera size={16} />
                  Editar Capa
                </button>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // MODO CIRCULAR (md / lg) — foto limpa + botões ABAIXO do círculo
  // ─────────────────────────────────────────────────────────────────
  const circleSize = size === 'lg' ? 'h-28 w-28' : 'h-20 w-20';
  const showDelete = !previewFile && !!currentUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Círculo da foto — completamente limpo */}
      <div className={`relative ${circleSize} rounded-full overflow-hidden border-4 border-white shadow-lg bg-neutral-100 shrink-0`}>
        {activeSrc ? (
          <img
            src={activeSrc}
            alt="Foto"
            className={`h-full w-full object-cover ${isDeleting ? 'opacity-40 grayscale' : ''}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-neutral-200">
            <Camera size={size === 'lg' ? 28 : 22} className="text-neutral-400" />
          </div>
        )}

        {/* Spinner de deleção dentro do círculo (único caso aceitável) */}
        {isDeleting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-neutral-500" />
          </div>
        )}

        {/* Indicador visual de preview ativo — borda colorida */}
        {previewFile && !isUploading && (
          <div className="absolute inset-0 rounded-full ring-4 ring-orange-400 ring-offset-2 pointer-events-none" />
        )}
      </div>

      {/* Botões de ação — ABAIXO do círculo */}
      {!readOnly && (
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-500"
            >
              <Loader2 size={12} className="animate-spin" />
              <span className="text-xs font-bold">Enviando...</span>
            </motion.div>
          ) : previewFile ? (
            /* Estado de preview: Salvar + Cancelar */
            <motion.div
              key="preview-actions"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={cancelPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors border border-red-100"
              >
                <XIcon size={12} strokeWidth={3} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmUpload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-sm shadow-emerald-500/30"
              >
                <Check size={12} strokeWidth={3} />
                Salvar foto
              </button>
            </motion.div>
          ) : (
            /* Estado normal: Alterar + Remover */
            <motion.div
              key="normal-actions"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-700 text-white text-xs font-bold transition-colors"
              >
                <Camera size={12} />
                Alterar foto
              </button>

              {showDelete && (
                <button
                  type="button"
                  onClick={deletePhoto}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-red-50 text-neutral-500 hover:text-red-500 text-xs font-bold transition-colors border border-neutral-200 hover:border-red-100"
                >
                  <Trash2 size={12} />
                  Remover
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
