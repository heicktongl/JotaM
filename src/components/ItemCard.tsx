import React from 'react';
import { motion } from 'motion/react';
import { MapPin, ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { Product, Service } from '../data';
import { Link } from 'react-router-dom';

interface CardProps {
  item: Product | Service;
  type: 'product' | 'service';
}

export const ItemCard: React.FC<CardProps> = ({ item, type }) => {
  const isProduct = type === 'product';
  const product = item as Product;
  const service = item as Service;

  return (
    <Link to={`/item/${type}/${item.id}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group relative flex flex-col h-full overflow-hidden rounded-3xl bg-white border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-neutral-200/50 transition-all duration-300 hover:-translate-y-1"
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-900 backdrop-blur-md shadow-sm">
              {item.category}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-neutral-700 backdrop-blur-md shadow-sm">
              <MapPin size={12} className="text-orange-500" />
              {item.distance}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-1">
            <h3 className="font-display text-lg font-bold leading-tight text-neutral-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
              {item.name}
            </h3>
          </div>

          <p className="mb-4 text-sm font-medium text-neutral-500 line-clamp-2">
            {isProduct ? product.description : `Oferecido por ${service.provider}`}
          </p>

          {/* Footer Section */}
          <div className="mt-auto flex items-end justify-between pt-4 border-t border-neutral-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
                {isProduct ? 'Preço' : 'Por hora'}
              </span>
              <span className="text-2xl font-black text-neutral-900 leading-none flex items-baseline gap-1">
                <span className="text-sm font-bold text-neutral-400">R$</span>
                {isProduct ? product.price.toFixed(2) : service.pricePerHour.toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {!isProduct && (
                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-600">
                  <Star size={12} fill="currentColor" />
                  <span className="text-xs font-bold">{service.rating}</span>
                </div>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 text-neutral-900 transition-all group-hover:bg-orange-600 group-hover:text-white">
                {isProduct ? <ShoppingBag size={18} /> : <ArrowRight size={18} />}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
