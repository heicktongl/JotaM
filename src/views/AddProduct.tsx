import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Camera, Plus, X } from 'lucide-react';
import { Logo } from '../components/Logo';

export const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Verduras',
    stock: '',
  });

  // @DB_TODO: Fetch available categories from 'categories' table
  const categories = ['Verduras', 'Frutas', 'Legumes', 'Temperos', 'Outros'];

  const addMockImage = () => {
    if (images.length < 5) {
      const newImage = `https://picsum.photos/seed/${Math.random()}/800/600`;
      setImages([...images, newImage]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      alert('Por favor, adicione pelo menos uma foto.');
      return;
    }
    // @DB_TODO: Save new product data (formData + images) to 'products' table, associated with the current seller's ID
    alert('Produto cadastrado com sucesso!');
    navigate('/admin/products');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 lg:pb-8">
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
                {images.map((img, index) => (
                  <motion.div 
                    key={img}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-3xl overflow-hidden bg-neutral-200 border border-neutral-100 group"
                  >
                    <img src={img} className="h-full w-full object-cover" alt="" />
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
                <button 
                  type="button"
                  onClick={addMockImage}
                  className="aspect-square rounded-3xl border-2 border-dashed border-neutral-200 bg-white flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-orange-500 hover:text-orange-500 transition-all"
                >
                  <div className="p-3 rounded-full bg-neutral-50">
                    <Plus size={24} />
                  </div>
                  <span className="text-xs font-bold">Adicionar</span>
                </button>
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
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* Pricing and Stock */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Preço e Categoria</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0,00"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Categoria</label>
                  <select 
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all appearance-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Estoque</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Quantidade Inicial</label>
                  <input 
                    type="number" 
                    required
                    placeholder="Ex: 50"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                  <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  <p className="text-xs font-bold text-orange-700">O estoque será atualizado automaticamente após cada venda.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
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
              className="flex-1 rounded-2xl bg-neutral-900 py-4 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all"
            >
              Salvar Produto
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
