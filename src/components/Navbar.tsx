import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed w-full z-50 h-20 px-4 md:px-12 flex items-center justify-between border-b border-gray-100 bg-white">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-10 h-10 bg-green-950 flex items-center justify-center rounded-sm">
          <span className="text-gold-500 font-serif text-2xl font-bold italic">P</span>
        </div>
        <span className="text-xl font-bold tracking-tight uppercase text-green-950">
          Property<span className="text-gold-500">Dekho</span>
        </span>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-8 text-sm font-semibold uppercase tracking-widest absolute left-1/2 -translate-x-1/2">
        <Link to="/" className={isActive('/') ? "text-green-950 border-b-2 border-gold-500" : "text-gray-500 hover:text-gold-500 transition-colors"}>Home</Link>
        <Link to="/properties" className={isActive('/properties') ? "text-green-950 border-b-2 border-gold-500" : "text-gray-500 hover:text-gold-500 transition-colors"}>Properties</Link>
        <Link to="/contact" className={isActive('/contact') ? "text-green-950 border-b-2 border-gold-500" : "text-gray-500 hover:text-gold-500 transition-colors"}>Contact</Link>
      </div>

      <div className="hidden md:flex items-center gap-6">
        {user ? (
          <>
            {role === 'admin' && (
              <Link to="/admin" className="text-sm font-bold uppercase tracking-wider text-green-950 hover:text-gold-500 transition-colors">
                Dashboard
              </Link>
            )}
            <button 
              onClick={() => auth.signOut()}
              className="bg-green-950 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest border border-gold-500 hover:bg-white hover:text-green-950 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" className="bg-green-950 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest border border-gold-500 hover:bg-white hover:text-green-950 transition-all">
            Login
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X className="text-green-950" /> : <Menu className="text-green-950" />}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-xl"
        >
          <div className="px-6 py-6 flex flex-col space-y-4">
            <Link to="/" onClick={() => setIsOpen(false)} className={`uppercase tracking-widest font-semibold text-sm ${isActive('/') ? 'text-gold-500' : 'text-green-950'}`}>Home</Link>
            <Link to="/properties" onClick={() => setIsOpen(false)} className={`uppercase tracking-widest font-semibold text-sm ${isActive('/properties') ? 'text-gold-500' : 'text-green-950'}`}>Properties</Link>
            <Link to="/contact" onClick={() => setIsOpen(false)} className={`uppercase tracking-widest font-semibold text-sm ${isActive('/contact') ? 'text-gold-500' : 'text-green-950'}`}>Contact</Link>
            {user ? (
               <>
                {role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsOpen(false)} className={`uppercase tracking-widest font-semibold text-sm ${isActive('/admin') ? 'text-gold-500' : 'text-green-950'}`}>Dashboard</Link>
                )}
                <button onClick={() => { auth.signOut(); setIsOpen(false); }} className="text-left text-green-950 uppercase tracking-widest font-semibold text-sm pt-4 border-t border-gray-100">Sign Out</button>
               </>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="bg-green-950 text-white text-center px-6 py-3 mt-4 text-xs font-bold uppercase tracking-widest border border-gold-500">Login</Link>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
