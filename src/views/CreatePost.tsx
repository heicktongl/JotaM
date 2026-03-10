import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Store, Briefcase, Camera, Send, 
  Loader2, AlertCircle, ChevronLeft, Plus, Trash2,
  Tag, Info, MessageSquareText as MsgIcon, Package
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useLocationScope } from '../context/LocationContext';

type AuthorType = 'personal' | 'seller' | 'provider';
type PostStep = 'choice' | 'form';
type PostType = 'free' | 'product' | 'service';

export const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { location } = useLocationScope();
  
  const [step, setStep] = useState<PostStep>('choice');
  const [authorType, setAuthorType] = useState<AuthorType>('personal');
  const [postType, setPostType] = useState<PostType>('free');

  // SIS-UX-INSTANT: Captura escolha do Bottom Sheet e pula a escolha se já definida
  useEffect(() => {
    const roleParam = searchParams.get('role') as AuthorType;
    if (roleParam && ['personal', 'seller', 'provider'].includes(roleParam)) {
      setAuthorType(roleParam);
      setStep('form');
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{ isSeller: boolean; isProvider: boolean; sellerData?: any; providerData?: any }>({
    isSeller: false,
    isProvider: false
  });

  // Form states
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Product/Service specific states
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDescription, setItemDescription] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const checkRoles = async () => {
      const [sellerRes, providerRes] = await Promise.all([
        supabase.from('sellers').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('service_providers').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      setRoles({
        isSeller: !!sellerRes.data,
        isProvider: !!providerRes.data,
        sellerData: sellerRes.data,
        providerData: providerRes.data
      });
    };

    checkRoles();
  }, [user, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 6) {
      alert('Máximo de 6 fotos permitido.');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    const newPreviews = files.map((file: File) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (!user || !location) return;
    if (images.length === 0 && !content && postType === 'free') {
      alert('Adicione um texto ou pelo menos uma foto.');
      return;
    }

    setLoading(true);
    try {
      const uploadedUrls: string[] = [];

      // Upload images
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `posts/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
      }

      // Metadata for special types
      const metadata: any = {};
      if (postType === 'product') {
        metadata.product = { name: itemName, price: Number(itemPrice), description: itemDescription };
      } else if (postType === 'service') {
        metadata.service = { name: itemName, price: itemPrice ? Number(itemPrice) : null, description: itemDescription };
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        author_type: authorType,
        content: content,
        image_urls: uploadedUrls,
        city: location.city,
        neighborhood: location.neighborhood,
        metadata
      });

      if (error) throw error;

      navigate('/');
    } catch (err) {
      console.error('Erro ao publicar:', err);
      alert('Falha ao publicar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-neutral-100 px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => step === 'choice' ? navigate(-1) : setStep('choice')}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
        >
          {step === 'choice' ? <X size={24} /> : <ChevronLeft size={24} />}
        </button>
        <h1 className="font-display font-extrabold text-lg">
          {step === 'choice' ? 'Publicar como...' : 'Nova Publicação'}
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {step === 'choice' ? (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <button
                onClick={() => { setAuthorType('personal'); setStep('form'); }}
                className="w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-neutral-100 hover:border-orange-500 hover:bg-orange-50/30 transition-all text-left group"
              >
                <div className="h-12 w-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">Perfil Pessoal</h3>
                  <p className="text-sm text-neutral-500">Poste novidades ou dúvidas no seu bairro.</p>
                </div>
              </button>

              {(roles.isSeller || roles.isProvider) && (
                <button
                  onClick={() => { 
                    setAuthorType(roles.isSeller ? 'seller' : 'provider'); 
                    setStep('form'); 
                  }}
                  className="w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-neutral-100 hover:border-orange-500 hover:bg-orange-50/30 transition-all text-left group"
                >
                  <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                    {roles.isSeller ? <Store size={24} /> : <Briefcase size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900">Minha Vitrine</h3>
                    <p className="text-sm text-neutral-500">
                      Publique ofertas ou atualizações da sua {roles.isSeller ? 'loja' : 'prestação de serviço'}.
                    </p>
                  </div>
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Type Selector for Vitrine */}
              {authorType !== 'personal' && (
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {[
                    { id: 'free', label: 'Post Livre', icon: MsgIcon },
                    { id: 'product', label: 'Produto', icon: Package, roles: ['seller'] },
                    { id: 'service', label: 'Serviço', icon: Briefcase, roles: ['provider'] }
                  ].filter(t => !t.roles || (authorType === 'seller' && t.roles.includes('seller')) || (authorType === 'provider' && t.roles.includes('provider')))
                  .map(type => (
                    <button
                      key={type.id}
                      onClick={() => setPostType(type.id as PostType)}
                      className={`whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-bold border transition-all ${
                        postType === type.id 
                        ? 'bg-orange-600 border-orange-600 text-white' 
                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-orange-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Form Content */}
              <div className="space-y-4">
                {(postType === 'product' || postType === 'service') && (
                  <div className="space-y-3 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                       <Tag size={16} />
                       <span className="text-xs font-bold uppercase tracking-wider">Dados do {postType === 'product' ? 'Produto' : 'Serviço'}</span>
                    </div>
                    <input 
                      type="text"
                      placeholder={`Nome do ${postType === 'product' ? 'produto' : 'serviço'}`}
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                    />
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">R$</span>
                       <input 
                        type="number"
                        placeholder="0,00"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm border-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <textarea
                  placeholder={
                    postType === 'free' 
                    ? "O que está acontecendo no bairro?" 
                    : "Descreva detalhes importantes..."
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full p-4 rounded-3xl bg-neutral-50 border-none focus:ring-2 focus:ring-orange-500 text-neutral-900 placeholder:text-neutral-400 resize-none"
                />

                {/* Photo Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {imagePreviews.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group">
                      <img src={url} alt="Post preview" className="h-full w-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {images.length < 6 && (
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-orange-500 hover:text-orange-500 cursor-pointer transition-all bg-neutral-50/50">
                      <Camera size={24} />
                      <span className="text-[10px] font-bold uppercase">Adicionar</span>
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                    </label>
                  )}
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || (images.length === 0 && !content && postType === 'free')}
                    className="w-full h-14 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 hover:bg-orange-700 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    {loading ? 'Publicando...' : 'Publicar agora'}
                  </button>
                  <p className="text-center text-[10px] text-neutral-400 mt-4 leading-relaxed px-4">
                    Sua publicação será visível apenas para usuários em <strong>{location?.neighborhood || 'seu bairro'}</strong>.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// Final do arquivo limpo - Antigravity Senior Cleanup
