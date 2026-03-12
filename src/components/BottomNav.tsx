import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Package, Search, User, Plus, Store, Briefcase, 
  X, ChevronLeft, Camera, Send, 
  Loader2, Trash2, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useLocationScope } from '../context/LocationContext';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location: userLoc } = useLocationScope();
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'identity' | 'compose'>('identity');
  const [roles, setRoles] = useState({ isSeller: false, isProvider: false });
  const [names, setNames] = useState({ personal: '', store: '', provider: '' });
  const [selectedRole, setSelectedRole] = useState<'personal' | 'seller' | 'provider'>('personal');

  // Form states
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // SIS-IDENTITY-SCAN: Busca nomes reais das identidades
  useEffect(() => {
    if (user) {
      const fetchIdentities = async () => {
        const [seller, provider] = await Promise.all([
          supabase.from('sellers').select('store_name').eq('user_id', user.id).maybeSingle(),
          supabase.from('service_providers').select('name').eq('user_id', user.id).maybeSingle()
        ]);
        
        setNames({
          personal: user.user_metadata?.name || user.email?.split('@')[0] || 'Meu Perfil',
          store: seller.data?.store_name || '',
          provider: provider.data?.name || ''
        });
        setRoles({ isSeller: !!seller.data, isProvider: !!provider.data });
      };
      fetchIdentities();
    }
  }, [user]);

  useEffect(() => {
    setIsVisible(true);
    setIsSheetOpen(false);
    resetForm();
  }, [location.pathname]);

  // SIS-NAVIGATION-SMOOTH: Oculta a barra ao rolar para baixo
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const resetForm = () => {
    setCurrentStep('identity');
    setContent('');
    setPrice('');
    setImages([]);
    setPreviews([]);
    setIsLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (images.length + files.length > 6) {
      alert('Máximo de 6 fotos.');
      return;
    }

    const oversizedFiles = files.filter(f => f.size > MAX_SIZE);
    if (oversizedFiles.length > 0) {
      alert('Algumas fotos excedem o limite de 5MB e foram removidas.');
      return;
    }

    setImages([...images, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (idx: number) => {
    const newImages = [...images];
    newImages.splice(idx, 1);
    setImages(newImages);
    URL.revokeObjectURL(previews[idx]);
    const newPreviews = [...previews];
    newPreviews.splice(idx, 1);
    setPreviews(newPreviews);
  };

  const handlePublish = async () => {
    if (!user || !userLoc) return;
    setIsLoading(true);
    try {
      const imageUrls: string[] = [];
      for (const file of images) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error: upError } = await supabase.storage.from('posts').upload(`content/${user.id}/${fileName}`, file);
        if (upError) throw upError;
        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(`content/${user.id}/${fileName}`);
        imageUrls.push(publicUrl);
      }

      await supabase.from('posts').insert({
        user_id: user.id,
        author_type: selectedRole,
        content,
        image_urls: imageUrls,
        city: userLoc.city,
        neighborhood: userLoc.neighborhood,
        metadata: {
          author_name: selectedRole === 'personal' ? names.personal : (selectedRole === 'seller' ? names.store : names.provider),
          author_avatar: user.user_metadata?.avatar_url || null,
          price: selectedRole !== 'personal' && price ? Number(price) : undefined
        }
      });

      setIsSheetOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Erro ao publicar.');
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { to: '/', icon: Package, label: 'Feed' },
    { to: '#create', icon: Plus, label: 'Criar', isCenter: true },
    { to: '/search', icon: Search, label: 'Busca' },
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  const handleCreateClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsSheetOpen(true);
  };

  return (
    <>
      <motion.nav 
        initial={false}
        animate={{ 
          y: isVisible ? 0 : 120,
          x: '-50%', 
          opacity: isVisible ? 1 : 0 
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed bottom-6 left-1/2 z-50 pointer-events-auto"
      >
        <div className="flex items-center gap-10 rounded-full bg-white/90 px-8 py-3 text-neutral-900 shadow-2xl border border-white/20 backdrop-blur-xl">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            
            if (item.isCenter) {
              return (
                <button key="create-btn" onClick={handleCreateClick} className="relative -mt-10">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-xl shadow-orange-600/40 ring-4 ring-white"
                  >
                    <Plus size={28} strokeWidth={2.5} />
                  </motion.div>
                </button>
              );
            }

            return (
              <Link key={item.to} to={item.to} className="relative">
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    isActive ? 'text-orange-600' : 'text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'fill-orange-600/10' : ''} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.nav>

      <AnimatePresence>
        {isSheetOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSheetOpen(false)} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className={`fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[40px] px-8 pb-10 pt-6 shadow-2xl overflow-hidden ${currentStep === 'compose' ? 'h-[85vh]' : 'h-auto'}`}
            >
              <div className="mx-auto w-12 h-1.5 bg-neutral-100 rounded-full mb-8" />
              
              <AnimatePresence mode="wait">
                {currentStep === 'identity' ? (
                  <motion.div key="identity" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-black text-neutral-900">Publicar como...</h2>
                      <button onClick={() => setIsSheetOpen(false)} className="p-2 bg-neutral-50 rounded-full text-neutral-400"><X size={20} /></button>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={() => { setSelectedRole('personal'); setCurrentStep('compose'); }}
                        className="group w-full flex items-center justify-between p-5 rounded-3xl border-2 border-neutral-50 hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-orange-100 group-hover:text-orange-600"><User size={28} /></div>
                          <div>
                            <h3 className="font-bold text-lg text-neutral-900">{names.personal}</h3>
                            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Perfil pessoal</p>
                          </div>
                        </div>
                      </button>

                      {roles.isSeller && (
                        <button
                          onClick={() => { setSelectedRole('seller'); setCurrentStep('compose'); }}
                          className="group w-full flex items-center justify-between p-5 rounded-3xl border-2 border-neutral-50 hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600"><Store size={28} /></div>
                            <div>
                              <h3 className="font-bold text-lg text-neutral-900">{names.store}</h3>
                              <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Minha Vitrine</p>
                            </div>
                          </div>
                        </button>
                      )}

                      {roles.isProvider && (
                        <button
                          onClick={() => { setSelectedRole('provider'); setCurrentStep('compose'); }}
                          className="group w-full flex items-center justify-between p-5 rounded-3xl border-2 border-neutral-50 hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600"><Briefcase size={28} /></div>
                            <div>
                              <h3 className="font-bold text-lg text-neutral-900">{names.provider}</h3>
                              <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Minha Vitrine</p>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="compose" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <button onClick={() => setCurrentStep('identity')} className="p-2 bg-neutral-50 rounded-full text-neutral-400"><ChevronLeft size={20} /></button>
                      <h2 className="text-lg font-black text-neutral-900 truncate px-4">
                        {selectedRole === 'personal' ? names.personal : (selectedRole === 'seller' ? names.store : names.provider)}
                      </h2>
                      <div className="w-10" />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6 pb-32">
                      {selectedRole !== 'personal' && (
                        <div className="p-5 bg-orange-50/50 rounded-[32px] border border-orange-100 space-y-2">
                          <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest px-1">Quanto custa? (Opcional)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-orange-600 text-lg">R$</span>
                            <input 
                              type="number" 
                              placeholder="0.00" 
                              value={price} 
                              onChange={e => setPrice(e.target.value)} 
                              className="w-full bg-white border-2 border-transparent focus:border-orange-500 rounded-2xl pl-12 pr-4 py-4 text-xl font-black shadow-sm outline-none transition-all" 
                            />
                          </div>
                        </div>
                      )}

                      <textarea
                        placeholder="Escreva algo interessante para o bairro..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full min-h-[160px] p-6 rounded-[32px] bg-neutral-50 border-none focus:ring-2 focus:ring-orange-500 text-neutral-900 placeholder:text-neutral-400 text-lg resize-none outline-none"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        {previews.map((url, i) => (
                          <div key={i} className="relative rounded-2xl overflow-hidden shadow-sm group bg-neutral-100 flex items-center justify-center min-h-[150px]">
                            <img src={url} className="w-full h-full object-contain" />
                            <button onClick={() => removeImage(i)} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                          </div>
                        ))}
                        {images.length < 6 && (
                          <label className="aspect-video rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-orange-500 hover:text-orange-500 cursor-pointer bg-neutral-50 transition-all hover:bg-orange-50/30">
                            <Camera size={24} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Fotos ({images.length}/6)</span>
                            <span className="text-[8px] font-bold text-neutral-400">Máx 5MB</span>
                            <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="absolute bottom-8 left-8 right-8 bg-white/80 backdrop-blur-md pt-4 pb-4">
                      <button
                        onClick={handlePublish}
                        disabled={isLoading || (!content && images.length === 0)}
                        className="w-full h-16 bg-orange-600 text-white rounded-[24px] font-black text-xl shadow-xl shadow-orange-600/30 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] transition-all"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                        {isLoading ? 'PUBLICANDO...' : 'PUBLICAR NO BAIRRO'}
                      </button>
                      <p className="text-center text-[10px] text-neutral-400 mt-4 font-black uppercase tracking-widest leading-relaxed">
                        SIS-LOCA: {userLoc?.neighborhood || 'local'} • {userLoc?.city || 'cidade'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
