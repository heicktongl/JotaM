import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ConsumerFeed } from './views/ConsumerFeed';
import { SearchPage } from './views/SearchPage';
import { ProfilePage } from './views/ProfilePage';
import { ProductAdmin } from './views/ProductAdmin';
import { AddProduct } from './views/AddProduct';
import { ServiceAdmin } from './views/ServiceAdmin';
import { ServiceAvailability } from './views/ServiceAvailability';
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
              <Route path="/settings" element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SettingsPage />
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
              <Route path="/admin/services/availability" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ServiceAvailability />
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
            </Routes>
          </AnimatePresence>
        </Router>
      </CartProvider>
    </LocationProvider>
  );
}
