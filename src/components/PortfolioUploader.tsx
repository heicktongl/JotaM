import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ImagePlus, X, Loader2, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

const MAX_PHOTOS = 6;
const MAX_SIZE_MB = 5;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

interface PhotoItem {
    // Foto já salva no banco
    id?: string;
    url: string;
    position: number;
    // Foto pending (local, ainda não enviada)
    file?: File;
    localPreview?: string;
    isUploading?: boolean;
    error?: string;
}

interface PortfolioUploaderProps {
    uid: string;
    providerId: string | null;
    onPhotosChange?: (urls: string[]) => void;
}

export const PortfolioUploader: React.FC<PortfolioUploaderProps> = ({
    uid,
    providerId,
    onPhotosChange,
}) => {
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Carrega fotos existentes do banco quando providerId estiver disponível
    const loadExistingPhotos = useCallback(async () => {
        if (!providerId) return;
        setIsLoadingExisting(true);
        try {
            const { data, error } = await supabase
                .from('provider_portfolio_photos')
                .select('id, url, position')
                .eq('provider_id', providerId)
                .order('position', { ascending: true });

            if (error) throw error;
            if (data && data.length > 0) {
                setPhotos(data.map((p) => ({ id: p.id, url: p.url, position: p.position })));
            }
        } catch (err) {
            console.error('Erro ao carregar portfólio:', err);
        } finally {
            setIsLoadingExisting(false);
        }
    }, [providerId]);

    useEffect(() => {
        loadExistingPhotos();
    }, [loadExistingPhotos]);

    // Atualiza o pai com as URLs de todas as fotos já no storage
    useEffect(() => {
        if (onPhotosChange) {
            // Inclui tanto fotos salvas no banco quanto as que foram ao storage mas sem banco ainda
            const allStorageUrls = photos
                .filter((p) => !p.file && !p.isUploading && p.url && !p.localPreview)
                .map((p) => p.url);
            onPhotosChange(allStorageUrls);
        }
    }, [photos, onPhotosChange]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        const savedCount = photos.filter((p) => !p.file).length;
        const pendingCount = photos.filter((p) => !!p.file).length;
        const remaining = MAX_PHOTOS - savedCount - pendingCount;
        const toAdd = files.slice(0, remaining);

        const newItems: PhotoItem[] = [];

        toAdd.forEach((file) => {
            // Validação de tipo
            if (!ACCEPTED.includes(file.type)) {
                alert(`Formato inválido: ${file.name}. Use JPG, PNG ou WebP.`);
                return;
            }
            // Validação de tamanho
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                alert(`${file.name} excede ${MAX_SIZE_MB}MB.`);
                return;
            }
            const localPreview = URL.createObjectURL(file);
            newItems.push({
                url: localPreview, // temporário, será trocado pela URL real após upload
                position: savedCount + pendingCount + newItems.length,
                file,
                localPreview,
                isUploading: false,
            });
        });

        if (newItems.length > 0) {
            setPhotos((prev) => [...prev, ...newItems]);
            // Inicia uploads de cada nova foto passando a posição já calculada
            newItems.forEach((item) => uploadPhoto(item, item.position));
        }

        if (inputRef.current) inputRef.current.value = '';
    };

    const uploadPhoto = async (item: PhotoItem, positionOverride?: number) => {
        if (!item.file || !uid) return;

        // Marca como uploading
        setPhotos((prev) =>
            prev.map((p) =>
                p.localPreview === item.localPreview ? { ...p, isUploading: true, error: undefined } : p
            )
        );

        try {
            const ext = item.file.name.split('.').pop() || 'jpg';
            const path = `${uid}/portfolio_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(path, item.file, { upsert: true, contentType: item.file.type });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

            // Se providerId disponível, salva no banco
            let savedId: string | undefined;
            if (providerId) {
                const position = positionOverride ?? item.position;
                const { data: inserted, error: insertError } = await supabase
                    .from('provider_portfolio_photos')
                    .insert({
                        provider_id: providerId,
                        url: publicUrl,
                        position,
                    })
                    .select('id, position')
                    .single();

                if (insertError) throw insertError;
                savedId = inserted?.id;
            }

            // Libera a URL do blob local
            if (item.localPreview) URL.revokeObjectURL(item.localPreview);

            // Substitui o item local pelo salvo
            setPhotos((prev) =>
                prev.map((p) =>
                    p.localPreview === item.localPreview
                        ? {
                            id: savedId,
                            url: publicUrl,
                            position: item.position,
                            isUploading: false,
                        }
                        : p
                )
            );
        } catch (err) {
            console.error('Erro no upload da foto:', err);
            setPhotos((prev) =>
                prev.map((p) =>
                    p.localPreview === item.localPreview
                        ? { ...p, isUploading: false, error: 'Falha no upload. Tente novamente.' }
                        : p
                )
            );
        }
    };

    const removePhoto = async (photo: PhotoItem) => {
        // Se ainda está em upload, ignora
        if (photo.isUploading) return;

        // Se é local com erro, remove apenas do estado
        if (photo.file && photo.localPreview && !photo.id) {
            URL.revokeObjectURL(photo.localPreview);
            setPhotos((prev) => prev.filter((p) => p.localPreview !== photo.localPreview));
            return;
        }

        // Se está salva no banco, deleta
        if (photo.id && providerId) {
            try {
                await supabase
                    .from('provider_portfolio_photos')
                    .delete()
                    .eq('id', photo.id);

                // Tenta deletar do Storage (extrai o path da URL)
                try {
                    const url = new URL(photo.url);
                    const pathParts = url.pathname.split('/object/public/avatars/');
                    if (pathParts.length === 2) {
                        await supabase.storage.from('avatars').remove([pathParts[1]]);
                    }
                } catch { /* ignora erros de deleção do storage */ }

                setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            } catch (err) {
                console.error('Erro ao remover foto:', err);
            }
        }
    };

    const totalPhotos = photos.length;

    return (
        <div className="space-y-3">
            {/* Grid de fotos */}
            <div className="grid grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                    {photos.map((photo, index) => (
                        <motion.div
                            key={photo.localPreview ?? photo.id ?? photo.url}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-neutral-100 group bg-neutral-100"
                        >
                            {/* Imagem */}
                            <img
                                src={photo.url}
                                alt={`Portfólio ${index + 1}`}
                                className={`w-full h-full object-cover transition-all ${photo.isUploading ? 'opacity-40 blur-sm' : ''
                                    }`}
                            />

                            {/* Overlay de upload */}
                            {photo.isUploading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30">
                                    <Loader2 size={20} className="animate-spin text-white" />
                                    <span className="text-[10px] font-bold text-white">Enviando...</span>
                                </div>
                            )}

                            {/* Overlay de erro */}
                            {photo.error && !photo.isUploading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-900/60">
                                    <AlertCircle size={18} className="text-white" />
                                    <span className="text-[9px] font-bold text-white text-center px-1">{photo.error}</span>
                                </div>
                            )}

                            {/* Botão remover */}
                            {!photo.isUploading && (
                                <button
                                    type="button"
                                    onClick={() => removePhoto(photo)}
                                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                                >
                                    <X size={13} />
                                </button>
                            )}

                            {/* Badge Capa na primeira foto */}
                            {index === 0 && !photo.isUploading && (
                                <div className="absolute bottom-0 left-0 right-0 bg-purple-600/90 py-1 text-center">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Capa</span>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Botão adicionar */}
                {totalPhotos < MAX_PHOTOS && (
                    <label
                        htmlFor="portfolio-uploader-input"
                        className="aspect-square rounded-2xl border-2 border-dashed border-neutral-200 bg-white flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer"
                    >
                        <input
                            id="portfolio-uploader-input"
                            ref={inputRef}
                            type="file"
                            accept={ACCEPTED.join(',')}
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <div className="p-2 rounded-full bg-neutral-50 group-hover:bg-purple-50">
                            {isLoadingExisting ? (
                                <Loader2 size={22} className="animate-spin text-neutral-400" />
                            ) : (
                                <ImagePlus size={22} />
                            )}
                        </div>
                        <span className="text-[10px] font-bold text-center leading-tight">
                            {isLoadingExisting ? 'Carregando...' : 'Adicionar\nda Galeria'}
                        </span>
                    </label>
                )}
            </div>

            {/* Contador e aviso de formato */}
            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-neutral-400 font-medium">
                    JPG, PNG ou WebP · Máx. {MAX_SIZE_MB}MB por foto
                </span>
                <div className="flex items-center gap-1.5">
                    {photos.some((p) => p.isUploading) && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-purple-500">
                            <Upload size={10} />
                            Enviando...
                        </span>
                    )}
                    <span className="text-[10px] font-bold text-neutral-400">
                        {totalPhotos}/{MAX_PHOTOS}
                    </span>
                </div>
            </div>

            {/* Aviso quando sem providerId (novo perfil) */}
            {!providerId && totalPhotos > 0 && (
                <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    As fotos serão salvas automaticamente após a criação do seu perfil.
                </p>
            )}
        </div>
    );
};
