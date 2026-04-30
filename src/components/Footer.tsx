import { Link } from 'react-router-dom';
import { Facebook, Youtube, MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-green-950 flex items-center justify-center rounded-sm">
                <span className="text-gold-500 font-serif text-2xl font-bold italic">P</span>
              </div>
              <span className="text-xl font-bold tracking-tight uppercase text-green-950">
                Property<span className="text-gold-500">Dekho</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              The premier destination for luxury real estate in Bhubaneswar. We help you find the perfect place to call home.
            </p>
            <div className="flex space-x-4 text-green-950">
              <a href="https://www.facebook.com/plot.bbsr" target="_blank" rel="noopener noreferrer" className="hover:text-gold-500 transition-colors"><Facebook size={20} /></a>
              <a href="https://www.youtube.com/@propertybbsr7663/featured" target="_blank" rel="noopener noreferrer" className="hover:text-gold-500 transition-colors"><Youtube size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase font-bold mb-6 text-green-950">Quick Links</h4>
            <ul className="space-y-4 text-gray-500 text-sm font-medium">
              <li><Link to="/" className="hover:text-gold-500 transition-colors">Home</Link></li>
              <li><Link to="/properties" className="hover:text-gold-500 transition-colors">Properties</Link></li>
              <li><Link to="/about" className="hover:text-gold-500 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-gold-500 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase font-bold mb-6 text-green-950">Properties</h4>
            <ul className="space-y-4 text-gray-500 text-sm font-medium">
              <li><Link to="/properties?type=apartment" className="hover:text-gold-500 transition-colors">Luxury Apartments</Link></li>
              <li><Link to="/properties?type=villa" className="hover:text-gold-500 transition-colors">Villas</Link></li>
              <li><Link to="/properties?type=commercial" className="hover:text-gold-500 transition-colors">Commercial Space</Link></li>
              <li><Link to="/properties?type=plot" className="hover:text-gold-500 transition-colors">Plots & Lands</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase font-bold mb-6 text-green-950">Contact Us</h4>
            <ul className="space-y-4 text-gray-500 text-sm font-medium">
              <li className="flex items-start">
                <MapPin size={18} className="mr-3 text-gold-500 shrink-0 mt-0.5" />
                <span>Patia, Bhubaneswar,<br/>Odisha 751024, India</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-3 text-gold-500 shrink-0" />
                <span>+91 8260021529</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-3 text-gold-500 shrink-0" />
                <span>plotbbsr9@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
      
      <div className="h-14 bg-[#f9f9f7] border-t border-gray-100 px-4 sm:px-12 flex flex-col md:flex-row items-center justify-between text-[10px] text-gray-400 uppercase font-bold tracking-widest py-4 md:py-0">
        <div>&copy; {new Date().getFullYear()} PropertyDekho. All Rights Reserved.</div>
        <div className="flex gap-4 sm:gap-8 mt-2 md:mt-0">
          <a href="#" className="hover:text-gold-500 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gold-500 transition-colors">Terms</a>
          <a href="#" className="hover:text-gold-500 transition-colors">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
