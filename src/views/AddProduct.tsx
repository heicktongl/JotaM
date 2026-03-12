import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Plus, X, Loader2, Phone, ArrowRight, ChevronDown, ChevronUp, Puzzle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo';
import { extractBairroName } from '../utils/sis-loca';
export const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [images, setImages] = useState<File[]>([]);
  const [showPhoneGate, setShowPhoneGate] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [popularCategories] = useState(['Frutas', 'Verduras', 'Grãos', 'Laticínios', 'Artesanato', 'Bebidas']);
  const [saving, setSaving] = useState(false);
  
  // Controle de Multi-Bairros (Hyperlocal)
  const [bairrosAtendidos, setBairrosAtendidos] = useState<string[]>([]);
  const [isAllBairros, setIsAllBairros] = useState(true);
  const [selectedBairros, setSelectedBairros] = useState<string[]>([]);
  
  // Tipo de Preço: 'single' ou 'variations'
  const [priceType, setPriceType] = useState<'single' | 'variations'>('single');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock: '',
  });

  const [customCategory, setCustomCategory] = useState('');

  // Estado dos grupos de complemento
  const [complementGroups, setComplementGroups] = useState<Array<{
    name: string;
    required: boolean;
    max_choices: number;
    is_variation: boolean;
    items: Array<{ name: string; price: string; stock: string; image_url?: string }>
  }>>([]);

  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(null);

  useEffect(() => {
    // ╔══════════════════════════════════════════╗
    // ║     LembreteZap — Restauração de Rascunho ║
    // ║  Recupera formData, fotos e complementos  ║
    // ╚══════════════════════════════════════════╝
    let defaultCategoryId = '';
    const draft = sessionStorage.getItem('lembretezap_product_draft');
    if (draft) {
      try {
        console.log('[LembreteZap] Rascunho encontrado, restaurando...');
        const parsed = JSON.parse(draft);
        if (parsed) {
          // Restaurar dados do formulário
          if (parsed.formData) {
            setFormData(parsed.formData);
            defaultCategoryId = parsed.formData.category_id || '';
          }
          // Restaurar fotos (previews base64)
          if (parsed.imagePreviews && parsed.imagePreviews.length > 0) {
            setImagePreviews(parsed.imagePreviews);
            // Converter base64 de volta a File para o upload funcionar
            const filePromises = parsed.imagePreviews.map(async (b64: string, idx: number) => {
              const res = await fetch(b64);
              const blob = await res.blob();
              return new File([blob], `foto_${idx}.jpg`, { type: blob.type || 'image/jpeg' });
            });
            Promise.all(filePromises).then(files => setImages(files));
          }
          // Restaurar complementos e bairros
          if (parsed.complementGroups) {
            setComplementGroups(parsed.complementGroups);
          }
          if (parsed.isAllBairros !== undefined) setIsAllBairros(parsed.isAllBairros);
          if (parsed.selectedBairros) setSelectedBairros(parsed.selectedBairros);
        }
      } catch (e) {
        console.error('[LembreteZap] Erro ao restaurar rascunho:', e);
      }
    }

    // 2. Busca categorias em paralelo
    supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'product')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCategories(data);
          // Se não havia rascunho preenchendo a categoria, força a primeira
          setFormData(f => ({
            ...f,
            category_id: f.category_id || defaultCategoryId || data[0].id
          }));
        } else {
          // Se o banco estiver vazio, garante que pelo menos a opção de 'Nova' esteja disponível
          setFormData(f => ({
            ...f,
            category_id: f.category_id || defaultCategoryId || 'new'
          }));
        }
      });

    // 3. Buscar Bairros de Atendimento do Seller Logado
    const fetchSellerData = async () => {
       if (!user?.id) return;
       const { data } = await supabase.from('sellers').select('bairros_atendidos').eq('user_id', user.id).single();
       if (data && data.bairros_atendidos) {
          setBairrosAtendidos(data.bairros_atendidos);
       }
    };
    fetchSellerData();
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 5 - images.length;
    const toAdd = files.slice(0, remaining);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, file]);
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file as Blob);
    });

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleBairro = (n: string) => {
    if (selectedBairros.includes(n)) {
      setSelectedBairros(prev => prev.filter(b => b !== n));
    } else {
      setSelectedBairros(prev => [...prev, n]);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      alert('Por favor, adicione pelo menos uma foto.');
      return;
    }
    if (!user) {
      alert('Você precisa estar logado para cadastrar um produto.');
      return;
    }

    // Gate MVP: exige número de WhatsApp cadastrado antes de publicar
    const phone = (user.user_metadata?.whatsapp || '').replace(/\D/g, '');
    if (phone.length < 10) {
      setShowPhoneGate(true);
      return;
    }

    setSaving(true);
    try {
      // 0. Tratar Categoria Dinâmica
      let finalCategoryId = formData.category_id;
      
      if (formData.category_id === 'new') {
        if (!customCategory.trim()) {
          alert('Por favor, digite o nome da nova categoria.');
          setSaving(false);
          return;
        }

        // Busca se já existe (case-insensitive)
        const { data: existingCat } = await supabase
          .from('categories')
          .select('id')
          .ilike('name', customCategory.trim())
          .eq('type', 'product')
          .maybeSingle();

        if (existingCat) {
          finalCategoryId = existingCat.id;
        } else {
          // Cria nova categoria global para a comunidade
          const { data: newCat, error: catErr } = await supabase
            .from('categories')
            .insert({
              name: customCategory.trim(),
              type: 'product',
              icon: 'Puzzle' // Ícone padrão para novas categorias
            })
            .select('id')
            .single();

          if (catErr) throw catErr;
          finalCategoryId = newCat.id;
        }
      }

      // 1. Validação de Preço/Variação
      if (priceType === 'single' && (!formData.price || parseFloat(formData.price) <= 0)) {
        alert('Por favor, informe um preço válido.');
        setSaving(false);
        return;
      }
      if (priceType === 'variations') {
        const variationGroup = complementGroups.find(g => g.is_variation);
        if (!variationGroup || variationGroup.items.length === 0 || variationGroup.items.some(i => !i.name || !i.price)) {
          alert('Por favor, preencha todas as variações com nome e preço.');
          setSaving(false);
          return;
        }
      }

      // 2. Buscar o perfil de vendedor do usuário logado
      const { data: sellerData, error: sellerErr } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (sellerErr || !sellerData) {
        alert('Perfil de vendedor não encontrado. Crie sua loja primeiro.');
        setSaving(false);
        return;
      }

      // 3. Buscar a localização OFICIAL da loja
      const { data: storeLocation } = await supabase
        .from('store_locations')
        .select('neighborhood, city')
        .eq('seller_id', sellerData.id)
        .eq('is_primary', true)
        .maybeSingle();

      // 4. Upload da foto principal
      let mainImageUrl: string | null = null;
      if (images.length > 0) {
        const file = images[0];
        const ext = file.name.split('.').pop();
        const path = `${user.id}/product_${Date.now()}.${ext}`;
        mainImageUrl = await uploadFile(file, path);
      }

      // 5. Determinar preço base (se variações, usa o menor preço)
      let finalPrice = parseFloat(formData.price) || 0;
      if (priceType === 'variations') {
        const variationGroup = complementGroups.find(g => g.is_variation);
        if (variationGroup) {
          finalPrice = Math.min(...variationGroup.items.map(i => parseFloat(i.price)));
        }
      }

      const finalBairrosDisponiveis = isAllBairros ? [] : selectedBairros;

      // 6. Inserir o produto
      const { data: productRef, error: productErr } = await supabase.from('products').insert({
        seller_id: sellerData.id,
        category_id: finalCategoryId || null,
        name: formData.name,
        description: formData.description,
        price: finalPrice,
        stock: priceType === 'single' ? (formData.stock ? parseInt(formData.stock, 10) : null) : null, // Se variações, estoque é somado/gerido nos itens
        image_url: mainImageUrl,
        is_active: true,
        neighborhood: storeLocation?.neighborhood || null,
        city: storeLocation?.city || null,
        bairros_disponiveis: finalBairrosDisponiveis,
      }).select('id').single();

      if (productErr || !productRef) throw productErr;

      // 7. Salvar Variações e Complementos
      if (complementGroups.length > 0) {
        for (let gIdx = 0; gIdx < complementGroups.length; gIdx++) {
          const group = complementGroups[gIdx];
          
          // Se o tipo de preço for 'single', ignora grupos que marcados como variação (limpeza)
          if (priceType === 'single' && group.is_variation) continue;

          const { data: savedGroup } = await supabase
            .from('product_complement_groups')
            .insert({
              product_id: productRef.id,
              name: group.name,
              required: group.required,
              max_choices: group.max_choices,
              is_variation: group.is_variation,
              position: gIdx,
            })
            .select('id')
            .single();

          if (savedGroup && group.items.length > 0) {
            await supabase.from('product_complement_items').insert(
              group.items.map((item, iIdx) => ({
                group_id: savedGroup.id,
                name: item.name,
                price: parseFloat(item.price) || 0,
                stock: item.stock ? parseInt(item.stock, 10) : null,
                position: iIdx,
                image_url: item.image_url || null,
              }))
            );
          }
        }
      }

      alert('Produto cadastrado com sucesso!');
      sessionStorage.removeItem('lembretezap_product_draft');
      sessionStorage.removeItem('sovix_pending_publish');
      navigate('/profile');
    } catch (err: unknown) {
      console.error('Erro ao salvar produto:', err);
      alert('Erro ao salvar produto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleGoToSettings = () => {
    // ╔══════════════════════════════════════════════╗
    // ║   LembreteZap — Salvamento completo antes   ║
    // ║   de redirecionar para cadastro do número   ║
    // ╚══════════════════════════════════════════════╝
    console.log('[LembreteZap] Salvando rascunho completo antes de redirecionar...');
    const draft = {
      formData,
      imagePreviews,   // base64 — sobrevive ao redirect
      complementGroups, // grupos e itens
      isAllBairros,
      selectedBairros
    };
    sessionStorage.setItem('lembretezap_product_draft', JSON.stringify(draft));
    sessionStorage.setItem('sovix_pending_publish', location.pathname);
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 lg:pb-8">

      {/* ===== GATE: Modal de Telefone Obrigatório ===== */}
      <AnimatePresence>
        {showPhoneGate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPhoneGate(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-5">
                <Phone size={28} className="text-orange-600" />
              </div>
              <h2 className="text-xl font-extrabold text-neutral-900 mb-2">Número obrigatório para publicar</h2>
              <p className="text-[15px] text-neutral-500 mb-8 leading-relaxed">
                Para que seus clientes possam entrar em contato, cadastre seu <span className="font-bold text-neutral-700">WhatsApp</span> antes de criar sua primeira publicação.
              </p>
              <button
                onClick={handleGoToSettings}
                className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-orange-600 text-white font-bold text-[15px] hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20 mb-3"
              >
                Cadastrar Número
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => setShowPhoneGate(false)}
                className="w-full h-12 rounded-2xl text-neutral-500 font-bold text-sm hover:bg-neutral-100 transition-colors"
              >
                Agora não
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl pt-6 pb-4 px-6 shadow-sm border-b border-neutral-100">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-neutral-900">Novo Produto</h1>
          </div>
          <Logo className="scale-75 hidden sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Multiple Image Upload */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Fotos do Produto ({images.length}/5)</h3>
              <p className="text-[10px] font-bold text-neutral-400 uppercase">Mínimo 1 foto</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {imagePreviews.map((preview, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-3xl overflow-hidden bg-neutral-200 border border-neutral-100 group"
                  >
                    <img src={preview} className="h-full w-full object-cover" alt="" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-orange-600/90 py-1 text-center">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Principal</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {images.length < 5 && (
                <label className="aspect-square rounded-3xl border-2 border-dashed border-neutral-200 bg-white flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-orange-500 hover:text-orange-500 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <div className="p-3 rounded-full bg-neutral-50">
                    <Plus size={24} />
                  </div>
                  <span className="text-xs font-bold text-center">Adicionar<br />Lado a Lado</span>
                </label>
              )}
            </div>
          </section>

          {/* Basic Info */}
          <section className="space-y-6">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Informações Básicas</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">Nome do Produto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alface Crespa Orgânica"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">Descrição</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Conte um pouco sobre como este produto é cultivado..."
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Pricing and Stock Section */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Preçário e Variações</h3>
              
              {/* Toggle de Tipo de Preço */}
              <div className="flex bg-neutral-100 p-1 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setPriceType('single')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${priceType === 'single' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  Preço Único
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPriceType('variations');
                    // Garante que exista pelo menos um grupo de variação ao ativar
                    if (complementGroups.filter(g => g.is_variation).length === 0) {
                      setComplementGroups(prev => [
                        { name: 'Tamanho', required: true, max_choices: 1, is_variation: true, items: [{ name: '', price: '', stock: '' }] },
                        ...prev
                      ]);
                      setOpenGroupIndex(0);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${priceType === 'variations' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  Variações
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="wait">
                {priceType === 'single' ? (
                  <motion.div
                    key="single-price"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Preço do Produto (R$)</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          required={priceType === 'single'}
                          placeholder="0,00"
                          className="w-full rounded-2xl border border-neutral-200 bg-white pl-12 pr-5 py-4 text-lg font-bold text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all shadow-sm"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Quantidade em Estoque <span className="text-neutral-400 font-normal">(Opcional)</span></label>
                      <input
                        type="number"
                        placeholder="Ex: 50"
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all shadow-sm"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50 border border-orange-100 shadow-sm shadow-orange-600/5">
                      <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                      <p className="text-[11px] font-bold text-orange-700 leading-tight">Vendas atualizam o estoque automaticamente.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="variation-price"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="md:col-span-2 space-y-6"
                  >
                    {complementGroups.map((group, gIdx) => {
                      if (!group.is_variation) return null;
                      return (
                        <div key={gIdx} className="rounded-[32px] border border-neutral-200 bg-white shadow-xl overflow-hidden border-orange-100">
                          <div className="p-6 bg-orange-50/50 flex items-center justify-between border-b border-orange-100">
                            <div className="flex-1 max-w-xs">
                              <label className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1 block">Nome da Grade</label>
                              <input
                                type="text"
                                placeholder="Ex: Tamanho ou Sabor"
                                value={group.name}
                                onChange={(e) => {
                                  const updated = [...complementGroups];
                                  updated[gIdx].name = e.target.value;
                                  setComplementGroups(updated);
                                }}
                                className="w-full text-lg font-bold text-neutral-900 bg-transparent outline-none placeholder:text-orange-200"
                              />
                            </div>
                            <p className="text-[11px] font-bold text-orange-600/60 text-right bg-orange-100/50 px-3 py-1 rounded-full">Configure os preços e fotos abaixo</p>
                          </div>

                          <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                              {group.items.map((item, iIdx) => (
                                <motion.div 
                                  layout
                                  key={iIdx} 
                                  className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-[24px] bg-neutral-50 border border-neutral-200 group hover:border-orange-300 transition-all"
                                >
                                  {/* Seletor de Foto da Galeria */}
                                  <div className="shrink-0 flex flex-col gap-2">
                                    <div className="flex flex-wrap gap-1.5 justify-center">
                                      {imagePreviews.map((preview, pIdx) => (
                                        <button
                                          key={pIdx}
                                          type="button"
                                          onClick={() => {
                                            const updated = [...complementGroups];
                                            updated[gIdx].items[iIdx].image_url = preview;
                                            setComplementGroups(updated);
                                          }}
                                          className={`relative w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${item.image_url === preview ? 'border-orange-500 scale-110 shadow-lg' : 'border-neutral-200 opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
                                        >
                                          <img src={preview} className="w-full h-full object-cover" alt="" />
                                        </button>
                                      ))}
                                      {imagePreviews.length === 0 && (
                                        <div className="w-10 h-10 rounded-xl border-2 border-dashed border-neutral-200 bg-white flex items-center justify-center text-neutral-300">
                                          <Plus size={16} />
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-[9px] font-bold text-center text-neutral-400 uppercase">Vincular Foto</span>
                                  </div>

                                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 w-full">
                                    <div className="sm:col-span-5">
                                      <input
                                        type="text"
                                        placeholder="Opção (Ex: 500ml ou Chocolate)"
                                        value={item.name}
                                        onChange={(e) => {
                                          const updated = [...complementGroups];
                                          updated[gIdx].items[iIdx].name = e.target.value;
                                          setComplementGroups(updated);
                                        }}
                                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900 focus:border-orange-500 outline-none"
                                      />
                                    </div>
                                    <div className="sm:col-span-4 relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">R$</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Preço"
                                        value={item.price}
                                        onChange={(e) => {
                                          const updated = [...complementGroups];
                                          updated[gIdx].items[iIdx].price = e.target.value;
                                          setComplementGroups(updated);
                                        }}
                                        className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-4 py-3 text-sm font-bold text-neutral-900 focus:border-orange-500 outline-none"
                                      />
                                    </div>
                                    <div className="sm:col-span-3">
                                      <input
                                        type="number"
                                        placeholder="Estoque"
                                        value={item.stock}
                                        onChange={(e) => {
                                          const updated = [...complementGroups];
                                          updated[gIdx].items[iIdx].stock = e.target.value;
                                          setComplementGroups(updated);
                                        }}
                                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold text-neutral-900 focus:border-orange-500 outline-none text-center"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...complementGroups];
                                      updated[gIdx].items = updated[gIdx].items.filter((_, i) => i !== iIdx);
                                      setComplementGroups(updated);
                                    }}
                                    className="h-10 w-10 flex items-center justify-center rounded-full text-neutral-300 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all shadow-none sm:self-center"
                                  >
                                    <X size={18} />
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...complementGroups];
                                updated[gIdx].items.push({ name: '', price: '', stock: '' });
                                setComplementGroups(updated);
                              }}
                              className="w-full flex items-center justify-center gap-2 py-4 rounded-[20px] border-2 border-dashed border-orange-200 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-all"
                            >
                              <Plus size={18} /> Adicionar Nova Opção de Variação
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* ====== SEÇÃO DE COMPLEMENTOS ADICIONAIS ====== */}
          <section className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-neutral-100 text-neutral-600">
                  <Puzzle size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Complementos Adicionais</h3>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Ex: Granola, Sabores Extras, Caldas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setComplementGroups(prev => [
                    ...prev,
                    { name: '', required: false, max_choices: 1, is_variation: false, items: [] }
                  ]);
                  setOpenGroupIndex(complementGroups.length);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-full transition-all shadow-sm"
              >
                <Plus size={14} /> Novo Grupo de Adicionais
              </button>
            </div>

            {complementGroups.filter(g => !g.is_variation).length === 0 && (
              <div className="py-8 px-4 border border-dashed border-neutral-200 rounded-[24px] bg-white text-center">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Sem complementos adicionais</p>
                <p className="text-[10px] text-neutral-300 mt-1">Clique no botão acima para adicionar opcionais</p>
              </div>
            )}

            <div className="space-y-4">
              {complementGroups.map((group, gIdx) => {
                if (group.is_variation) return null;
                return (
                  <div key={gIdx} className="rounded-[24px] border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Cabeçalho do grupo */}
                    <div className="p-4 flex items-center gap-3 bg-neutral-50/50 border-b border-neutral-100">
                      <button
                        type="button"
                        onClick={() => setOpenGroupIndex(openGroupIndex === gIdx ? null : gIdx)}
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        {openGroupIndex === gIdx ? <ChevronUp size={16} className="text-neutral-400 shrink-0" /> : <ChevronDown size={16} className="text-neutral-400 shrink-0" />}
                        <input
                          type="text"
                          placeholder="Nome (ex: Coberturas)"
                          value={group.name}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const updated = [...complementGroups];
                            updated[gIdx].name = e.target.value;
                            setComplementGroups(updated);
                          }}
                          className="flex-1 text-sm font-bold text-neutral-900 bg-transparent outline-none placeholder:text-neutral-300"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setComplementGroups(prev => prev.filter((_, i) => i !== gIdx))}
                        className="h-8 w-8 flex items-center justify-center rounded-full text-neutral-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {openGroupIndex === gIdx && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="px-4 pb-4 space-y-4 pt-4"
                      >
                        {/* Configurações do grupo */}
                        <div className="flex flex-wrap items-center justify-between gap-4 px-1">
                          <label className="flex items-center gap-2 cursor-pointer bg-neutral-100/50 px-3 py-1.5 rounded-xl">
                            <input
                              type="checkbox"
                              checked={group.required}
                              onChange={(e) => {
                                const updated = [...complementGroups];
                                updated[gIdx].required = e.target.checked;
                                setComplementGroups(updated);
                              }}
                              className="w-4 h-4 accent-neutral-900 rounded"
                            />
                            <span className="text-[11px] font-bold text-neutral-700">Obrigatório</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Max Seleções:</span>
                            <input
                              type="number"
                              min="1"
                              value={group.max_choices}
                              onChange={(e) => {
                                const updated = [...complementGroups];
                                updated[gIdx].max_choices = parseInt(e.target.value) || 1;
                                setComplementGroups(updated);
                              }}
                              className="w-12 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-bold text-center focus:border-orange-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Itens do grupo */}
                        <div className="space-y-2">
                          {group.items.map((item, iIdx) => (
                            <div key={iIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Item (ex: Granola)"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...complementGroups];
                                  updated[gIdx].items[iIdx].name = e.target.value;
                                  setComplementGroups(updated);
                                }}
                                className="flex-1 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-orange-500 focus:bg-white transition-all outline-none"
                              />
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0,00"
                                  value={item.price}
                                  onChange={(e) => {
                                    const updated = [...complementGroups];
                                    updated[gIdx].items[iIdx].price = e.target.value;
                                    setComplementGroups(updated);
                                  }}
                                  className="w-20 rounded-xl border border-neutral-100 bg-neutral-50 pl-6 pr-2 py-2 text-sm text-neutral-900 focus:border-orange-500 focus:bg-white transition-all outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...complementGroups];
                                  updated[gIdx].items = updated[gIdx].items.filter((_, i) => i !== iIdx);
                                  setComplementGroups(updated);
                                }}
                                className="h-8 w-8 flex items-center justify-center rounded-full text-neutral-300 hover:bg-neutral-100 hover:text-neutral-500 transition-colors shrink-0"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...complementGroups];
                              updated[gIdx].items.push({ name: '', price: '', stock: '' });
                              setComplementGroups(updated);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-neutral-100 text-xs font-bold text-neutral-400 hover:border-orange-200 hover:text-orange-500 hover:bg-orange-50/20 transition-all mt-2"
                          >
                            <Plus size={14} /> Adicionar Item
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Disponibilidade por Bairro - Minimalista */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em]">Disponibilidade Regional</h3>
              <span className="text-[9px] font-bold text-neutral-300 uppercase">Opcional</span>
            </div>
            
            <div className="rounded-[24px] bg-neutral-100/50 p-4 border border-transparent hover:border-neutral-200 transition-all">
              {bairrosAtendidos.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAllBairros(true)}
                      className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold transition-all ${isAllBairros ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                      Todos os Bairros
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAllBairros(false)}
                      className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold transition-all ${!isAllBairros ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                      Bairros Específicos
                    </button>
                  </div>
                  
                  {!isAllBairros && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {bairrosAtendidos.map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => toggleBairro(b)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border ${selectedBairros.includes(b) ? 'bg-orange-600 border-orange-600 text-white shadow-sm' : 'bg-white border-neutral-100 text-neutral-400 hover:border-orange-200'}`}
                        >
                          {extractBairroName(b)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] font-bold text-neutral-400 text-center py-1">
                  Exibição padrão na sua localização principal.
                </p>
              )}
            </div>
          </section>

          {/* Categoria do Produto - Sistema Inteligente */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em]">Categorização</h3>
              <p className="text-[9px] font-bold text-neutral-300 uppercase">Organização Global</p>
            </div>
            
            <div className="rounded-[32px] border border-neutral-200 bg-white p-6 space-y-6 shadow-sm">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-neutral-700">Escolha uma categoria</label>
                
                {/* Categorias Populares / Existentes como Chips */}
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, category_id: cat.id });
                        setCustomCategory('');
                      }}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${formData.category_id === cat.id ? 'bg-neutral-900 border-neutral-900 text-white shadow-md' : 'bg-neutral-50 border-neutral-100 text-neutral-500 hover:border-neutral-200'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                  
                  {/* Se o banco estiver vazio, mostra sugestões populares */}
                  {categories.length === 0 && popularCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, category_id: 'new' });
                        setCustomCategory(cat);
                      }}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${customCategory === cat ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-orange-50/50 border-orange-100 text-orange-600/60 hover:border-orange-200'}`}
                    >
                      {cat}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category_id: 'new' });
                      setCustomCategory('');
                    }}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border flex items-center gap-1.5 ${formData.category_id === 'new' && !popularCategories.includes(customCategory) ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-dashed border-neutral-300 text-neutral-400 hover:border-orange-500 hover:text-orange-500'}`}
                  >
                    <Plus size={14} /> Outra...
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {formData.category_id === 'new' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="pt-4 border-t border-neutral-100 space-y-3"
                  >
                    <label className="block text-[11px] font-extrabold text-orange-600 uppercase tracking-widest">Nome da Nova Categoria</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Artesanato, Doces Caseiros..."
                        className="w-full rounded-2xl border-2 border-orange-100 bg-orange-50/20 px-5 py-4 text-sm font-bold text-neutral-900 focus:border-orange-500 focus:bg-white outline-none transition-all"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Puzzle size={18} className="text-orange-300" />
                      </div>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                      Sua sugestão ajudará a organizar a vitrine para todos os usuários do Sovix.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
          <div className="pt-8 flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-2xl border border-neutral-200 bg-white py-4 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all disabled:opacity-60"
            >
              {saving ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
