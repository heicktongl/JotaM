/**
 * LocationGuard.tsx
 * Componente de Blindagem Geográfica - Pilar B do Sistema de Location Security
 *
 * Propósito:
 *   Verificar se um determinado conteúdo (vitrine, produto) pertence à mesma cidade
 *   do usuário atual. Se não pertencer, exibe uma tela de bloqueio amigável no lugar
 *   do conteúdo, impedindo acesso cruzado entre cidades via links diretos.
 *   Se for da mesma cidade mas de outro bairro, exibe apenas um aviso (não bloqueia).
 *
 * Uso:
 *   <LocationGuard itemCity="São Luís" itemNeighborhood="Vila Brasil" itemUsername="@minha_loja">
 *     <SellerProfile />
 *   </LocationGuard>
 *
 * Escalabilidade:
 *   - Versão 1 (atual):    Bloqueio por Cidade Distinta | Aviso por Bairro Distinto
 *   - Versão 2 (plann.):   Raio de Atuação em KM configurável pelo vendedor (overrides aviso de bairro)
 *   - Versão 3 (plann.):   Whitelist de Cidades parceiras para lojas que fazem frete entre cidades
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinOff, ArrowLeft, TriangleAlert, MapPin } from 'lucide-react';
import { useLocationScope } from '../context/LocationContext';

interface LocationGuardProps {
    /** Cidade do item/vitrine sendo acessado */
    itemCity: string | null | undefined;
    /** Bairro do item/vitrine sendo acessado */
    itemNeighborhood?: string | null | undefined;
    /** Nome de exibição do proprietário (para mensagem da tela de bloqueio) */
    itemDisplayName?: string;
    /** Conteúdo a ser renderizado se o acesso for permitido */
    children: React.ReactNode;
    /** Se true, ignora a checagem (ex: admin, próprio dono) */
    bypass?: boolean;
}

export const LocationGuard: React.FC<LocationGuardProps> = ({
    itemCity,
    itemNeighborhood,
    itemDisplayName,
    children,
    bypass = false,
}) => {
    const { location } = useLocationScope();
    const navigate = useNavigate();

    // --- BYPASS: Admin, dono ou vitrine sem dados de local (sem lastro = permitido por ora) ---
    if (bypass || !location || !itemCity) {
        return <>{children}</>;
    }

    const normalizeStr = (s: string) =>
        s
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();

    const userCity = normalizeStr(location.city);
    const targetCity = normalizeStr(itemCity);

    // ================================================
    // PILAR B: BLOQUEIO TOTAL - Cidades Distintas
    // ================================================
    const isCityMismatch = userCity !== targetCity &&
        targetCity !== 'desconhecido' &&
        targetCity !== 'cidade desconhecida';

    if (isCityMismatch) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-8 text-center">
                <div className="h-24 w-24 rounded-full bg-red-50 flex items-center justify-center mb-6 text-red-500">
                    <MapPinOff size={40} strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-extrabold text-neutral-900 mb-3 tracking-tight">
                    Conteúdo fora da sua área
                </h1>
                <p className="text-neutral-500 max-w-sm mb-2">
                    <strong>{itemDisplayName ?? 'Esta vitrine'}</strong> atende exclusivamente a cidade de{' '}
                    <span className="font-bold text-neutral-800">{itemCity}</span>.
                </p>
                <p className="text-neutral-400 text-sm max-w-xs mb-8">
                    Você está em <strong>{location.city}</strong>. O JotaM é um app hiperlocal — o conteúdo é exclusivo para quem está na mesma região.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 rounded-2xl bg-orange-600 px-8 py-4 font-bold text-white shadow-lg shadow-orange-600/30 hover:bg-orange-700 transition-all"
                >
                    <ArrowLeft size={18} />
                    Ver o que rola em {location.city}
                </button>
            </div>
        );
    }

    // ================================================
    // PILAR C: AVISO — Mesmo cidade, bairro diferente
    // ================================================
    const userNeighborhood = normalizeStr(location.neighborhood);
    const targetNeighborhood = itemNeighborhood ? normalizeStr(itemNeighborhood) : null;

    const isNeighborhoodMismatch =
        targetNeighborhood &&
        userNeighborhood !== targetNeighborhood &&
        targetNeighborhood !== 'desconhecido' &&
        userNeighborhood !== 'bairro desconhecido';

    return (
        <>
            {isNeighborhoodMismatch && (
                <div className="w-full bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3">
                    <TriangleAlert size={18} className="text-amber-500 shrink-0" />
                    <p className="text-sm font-medium text-amber-800">
                        Este vendedor está localizado no bairro{' '}
                        <strong>{itemNeighborhood}</strong>. Confirme a disponibilidade de atendimento
                        na sua área antes de realizar um pedido.
                    </p>
                    <a href="#" className="text-amber-600 text-sm font-bold whitespace-nowrap underline ml-auto hidden sm:block">
                        <MapPin size={14} className="inline mr-1" />
                        Ver no Mapa
                    </a>
                </div>
            )}
            {children}
        </>
    );
};
