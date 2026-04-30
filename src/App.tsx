/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Listings } from './pages/Listings';
import { PropertyDetails } from './pages/PropertyDetails';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { Chatbot } from './components/Chatbot';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';

const ProtectedRoute = ({ children, adminOnly = false }: { children: import('react').ReactNode, adminOnly?: boolean }) => {
  const { user, role, loading } = useAuthStore();
  
  if (loading) return <div className="flex bg-[#0A1A10] items-center justify-center min-h-screen text-[#CBAD69]">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && role !== 'admin') return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

export default function App() {
  const { user, loading } = useAuthStore();

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  if (loading && !user) {
     return <div className="flex bg-[#0A1A10] items-center justify-center min-h-screen text-[#CBAD69]">Initializing...</div>;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#0A1A10] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
        <Navbar />
        <main className="flex-grow pt-16">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/properties" element={<Listings />} />
              <Route path="/properties/:id" element={<PropertyDetails />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
        <Chatbot />
      </div>
    </Router>
  );
}
