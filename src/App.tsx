// Sovix Connect - Build Sync: 2026-03-10
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ConsumerFeed } from './views/ConsumerFeed';
import { SearchPage } from './views/SearchPage';
import { ProfilePage } from './views/ProfilePage';
import { ProductAdmin } from './views/ProductAdmin';
import { AddProduct } from './views/AddProduct';
import { ServiceAdmin } from './views/ServiceAdmin';
import { AddService } from './views/AddService';
import { EditService } from './views/EditService';
import { DeliveryAdmin } from './views/DeliveryAdmin';
import { DeliveryAreaSettings } from './views/DeliveryAreaSettings';
import { LocationProvider } from './context/LocationContext';
import { CartProvider } from './context/CartContext';
import { ItemDetail } from './views/ItemDetail';
import { CartPage } from './views/CartPage';
import { CheckoutPage } from './views/CheckoutPage';
import { SellerProfile } from './views/SellerProfile';
import { SettingsPage } from './views/SettingsPage';
import { LoginPage } from './views/LoginPage';
import { RegisterPage } from './views/RegisterPage';
import { SellerSetup } from './views/SellerSetup';
import { ServiceSetup } from './views/ServiceSetup';
import { ThemeGallery } from './views/ThemeGallery';
import { CreatePost } from './views/CreatePost';
import { FavoritesPage } from './views/FavoritesPage';
import { OrderHistoryPage } from './views/OrderHistoryPage';
import { FloatingCart } from './components/FloatingCart';

export default function App() {
  return (
    <LocationProvider>
      <CartProvider>
        <Router>
          <FloatingCart />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ConsumerFeed />
                </motion.div>
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
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SellerProfile />
                </motion.div>
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
        </Router>
      </CartProvider>
    </LocationProvider>
  );
}
