import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Contact() {
  const [searchParams] = useSearchParams();
  const propertyTitle = searchParams.get('property');
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    message: propertyTitle ? `I am interested in ${propertyTitle} and would like to know more.` : '' 
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: import('react').FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const messageId = Date.now().toString();
      await setDoc(doc(db, 'messages', messageId), {
        ...formData,
        status: 'new',
        notes: '',
        propertyId: '',
        senderId: '',
        createdAt: Date.now()
      });
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, 'messages');
      setStatus('error');
    }
  };

  return (
    <div className="bg-white dark:bg-green-950 min-h-screen">
      <div className="bg-green-950 py-16 text-center border-b border-green-900/50 flex flex-col items-center">
        <h1 className="text-4xl font-serif text-white mb-4">Contact Us</h1>
        <div className="w-16 h-1 bg-gold-500"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          <div>
            <h2 className="text-3xl font-serif text-green-950 dark:text-white mb-6">Get in Touch</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Whether you are looking to buy, sell, or rent a property in Bhubaneswar, our team of experts is here to guide you every step of the way.
            </p>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-gold-500/10 p-3 rounded-full mr-4 text-gold-500">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-green-950 dark:text-white mb-1">Office Address</h4>
                  <p className="text-gray-500">Esquare Plaza, Patia<br/>Bhubaneswar, Odisha 751024</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gold-500/10 p-3 rounded-full mr-4 text-gold-500">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-green-950 dark:text-white mb-1">Phone Number</h4>
                  <p className="text-gray-500">+91 8114676852</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-gold-500/10 p-3 rounded-full mr-4 text-gold-500">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-green-950 dark:text-white mb-1">Email Address</h4>
                  <p className="text-gray-500">saibusubha6127@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-green-900/20 p-8 rounded-sm border border-gray-200 dark:border-green-900">
            <h3 className="text-2xl font-serif text-green-950 dark:text-white mb-6">Send a Message</h3>
            
            {status === 'success' && (
              <div className="mb-6 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 p-4 border-l-4 border-green-500">
                Message sent successfully! We will get back to you soon. (Note: Admin can view this in the Dashboard CRM)
              </div>
            )}
            
            {status === 'error' && (
              <div className="mb-6 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 p-4 border-l-4 border-red-500">
                Failed to send message. Please try again or contact us directly via email.
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-3 px-4 focus:ring-1 focus:ring-gold-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-3 px-4 focus:ring-1 focus:ring-gold-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-3 px-4 focus:ring-1 focus:ring-gold-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message *</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-3 px-4 focus:ring-1 focus:ring-gold-500 outline-none resize-none"
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full bg-gold-500 hover:bg-gold-400 text-green-950 font-bold uppercase tracking-widest py-4 rounded-sm transition-colors disabled:opacity-50 mt-4"
              >
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
