// Sovix Connect - Build Sync: 2026-03-10
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LocationProvider } from './context/LocationContext';
import { CartProvider } from './context/CartContext';
import { supabase } from './lib/supabase';
import { FloatingCart } from './components/FloatingCart';
import { LoadingScreen } from './components/LoadingScreen';

// ⚡ Lazy Loading das Views (Code Splitting)
const ConsumerFeed = lazy(() => import('./views/ConsumerFeed').then(m => ({ default: m.ConsumerFeed })));
const SearchPage = lazy(() => import('./views/SearchPage').then(m => ({ default: m.SearchPage })));
const ProfilePage = lazy(() => import('./views/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ProductAdmin = lazy(() => import('./views/ProductAdmin').then(m => ({ default: m.ProductAdmin })));
const AddProduct = lazy(() => import('./views/AddProduct').then(m => ({ default: m.AddProduct })));
const ServiceAdmin = lazy(() => import('./views/ServiceAdmin').then(m => ({ default: m.ServiceAdmin })));
const AddService = lazy(() => import('./views/AddService').then(m => ({ default: m.AddService })));
const EditService = lazy(() => import('./views/EditService').then(m => ({ default: m.EditService })));
const DeliveryAdmin = lazy(() => import('./views/DeliveryAdmin').then(m => ({ default: m.DeliveryAdmin })));
const DeliveryAreaSettings = lazy(() => import('./views/DeliveryAreaSettings').then(m => ({ default: m.DeliveryAreaSettings })));
const ItemDetail = lazy(() => import('./views/ItemDetail').then(m => ({ default: m.ItemDetail })));
const CartPage = lazy(() => import('./views/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./views/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const SellerProfile = lazy(() => import('./views/SellerProfile').then(m => ({ default: m.SellerProfile })));
const SettingsPage = lazy(() => import('./views/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LoginPage = lazy(() => import('./views/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./views/RegisterPage').then(m => ({ default: m.RegisterPage })));
const SellerSetup = lazy(() => import('./views/SellerSetup').then(m => ({ default: m.SellerSetup })));
const ServiceSetup = lazy(() => import('./views/ServiceSetup').then(m => ({ default: m.ServiceSetup })));
const ThemeGallery = lazy(() => import('./views/ThemeGallery').then(m => ({ default: m.ThemeGallery })));
const CreatePost = lazy(() => import('./views/CreatePost').then(m => ({ default: m.CreatePost })));
const FavoritesPage = lazy(() => import('./views/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const OrderHistoryPage = lazy(() => import('./views/OrderHistoryPage').then(m => ({ default: m.OrderHistoryPage })));
import { VitrineSkeleton } from './components/VitrineSkeleton';

export default function App() {
  useEffect(() => {
    // ╔══════════════════════════════════════════════╗
    // ║     Supabase Warm-up (Silencioso)            ║
    // ║ Evita o erro 'Load failed' na 1ª interação   ║
    // ╚══════════════════════════════════════════════╝
    const warmUp = async () => {
      try {
        await supabase.auth.getSession();
        console.log('[Supabase] Conexão aquecida com sucesso.');
      } catch (e) {
        console.warn('[Supabase] Erro ao aquecer conexão:', e);
      }
    };
    warmUp();
  }, []);

  return (
    <LocationProvider>
      <CartProvider>
        <Router>
          <FloatingCart />
          <Suspense fallback={<LoadingScreen />}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={
                  <Suspense fallback={<div className="bg-white min-h-screen" />}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <ConsumerFeed />
                    </motion.div>
                  </Suspense>
                } />
                <Route path="/create" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <CreatePost />
                  </motion.div>
                } />
                <Route path="/login" element={
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <LoginPage />
                  </motion.div>
                } />
                <Route path="/register" element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <RegisterPage />
                  </motion.div>
                } />
                <Route path="/item/:type/:id" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ItemDetail />
                  </motion.div>
                } />
                <Route path="/:username" element={
                  <Suspense fallback={<VitrineSkeleton />}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <SellerProfile />
                    </motion.div>
                  </Suspense>
                } />
                <Route path="/cart" element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <CartPage />
                  </motion.div>
                } />
                <Route path="/orders" element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <OrderHistoryPage />
                  </motion.div>
                } />
                <Route path="/checkout" element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <CheckoutPage />
                  </motion.div>
                } />
                <Route path="/search" element={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <SearchPage />
                  </motion.div>
                } />
                <Route path="/profile" element={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ProfilePage />
                  </motion.div>
                } />
                <Route path="/favorites" element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <FavoritesPage />
                  </motion.div>
                } />
                <Route path="/settings" element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <SettingsPage />
                  </motion.div>
                } />
                <Route path="/seller-setup" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <SellerSetup />
                  </motion.div>
                } />
                <Route path="/service-setup" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ServiceSetup />
                  </motion.div>
                } />
                <Route path="/admin/products" element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ProductAdmin />
                  </motion.div>
                } />
                <Route path="/admin/products/new" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <AddProduct />
                  </motion.div>
                } />
                <Route path="/admin/services" element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ServiceAdmin />
                  </motion.div>
                } />
                <Route path="/admin/services/new" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <AddService />
                  </motion.div>
                } />
                <Route path="/admin/services/:id/edit" element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <EditService />
                  </motion.div>
                } />
                <Route path="/admin/delivery" element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <DeliveryAdmin />
                  </motion.div>
                } />
                <Route path="/admin/delivery/area" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <DeliveryAreaSettings />
                  </motion.div>
                } />
                <Route path="/theme-gallery" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ThemeGallery />
                  </motion.div>
                } />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </Router>
      </CartProvider>
    </LocationProvider>
  );
}
