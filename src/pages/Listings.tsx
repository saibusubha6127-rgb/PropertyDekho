import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MapPin, SlidersHorizontal } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { getYoutubeThumbnail } from '../lib/utils';

export function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [budget, setBudget] = useState(searchParams.get('budget') || '');
  const [amenity, setAmenity] = useState(searchParams.get('amenity') || '');
  
  const fetchProperties = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'properties'), where('status', '==', 'available'));
      
      // Note: Firestore doesn't support generic string contains. This is an exact match for demo purposes.
      if (type) {
        q = query(q, where('type', '==', type));
      }
      if (amenity) {
        q = query(q, where('amenities', 'array-contains', amenity));
      }
      
      const snapshot = await getDocs(q);
      let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Client-side filtering for like/contains since Firestore limitations
      if (location) {
        docs = docs.filter((p: any) => p.location.toLowerCase().includes(location.toLowerCase()));
      }
      
      if (budget) {
        docs = docs.filter((p: any) => p.price <= Number(budget));
      }
      
      setProperties(docs);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [searchParams]);

  const applyFilters = (e: import('react').FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (type) params.append('type', type);
    if (budget) params.append('budget', budget);
    if (amenity) params.append('amenity', amenity);
    setSearchParams(params);
  };

  return (
    <div className="bg-white dark:bg-green-950 min-h-screen">
      {/* Header */}
      <div className="bg-green-950 py-16 text-center border-b border-green-900/50">
        <h1 className="text-4xl font-serif text-white mb-4">Properties in Bhubaneswar</h1>
        <p className="text-gray-400 font-light">Explore our collection of premium real estate</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:w-1/4">
          <div className="bg-gray-50 dark:bg-green-900/20 p-6 rounded-sm border border-gray-200 dark:border-green-900 sticky top-24">
            <div className="flex items-center mb-6 text-green-950 dark:text-white pb-4 border-b border-gray-200 dark:border-green-900">
              <SlidersHorizontal size={20} className="mr-2 text-gold-500" />
              <h2 className="font-serif text-xl">Filters</h2>
            </div>
            
            <form onSubmit={applyFilters} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Patia, Khandagiri" 
                  className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Property Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none"
                >
                  <option value="">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="plot">Plot / Land</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Budget</label>
                <input 
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Enter max amount (₹)" 
                  className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Must Have Amenity</label>
                <select 
                  value={amenity}
                  onChange={(e) => setAmenity(e.target.value)}
                  className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none"
                >
                  <option value="">Any</option>
                  <option value="Swimming Pool">Swimming Pool</option>
                  <option value="Gym">Gym</option>
                  <option value="Parking">Parking</option>
                  <option value="Power Backup">Power Backup</option>
                  <option value="Security">Security</option>
                  <option value="Garden">Garden</option>
                  <option value="Elevator">Elevator</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-gold-500 hover:bg-gold-400 text-green-950 font-bold uppercase tracking-widest text-sm py-3 rounded-sm transition-colors">
                Apply Filters
              </button>
            </form>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="lg:w-3/4">
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
             {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-green-950 rounded-sm shadow-sm overflow-hidden animate-pulse border border-gray-100 dark:border-green-900">
                  <div className="h-64 bg-gray-200 dark:bg-green-900 w-full"></div>
                  <div className="p-6 space-y-4">
                     <div className="flex justify-between items-center">
                       <div className="h-4 bg-gray-200 dark:bg-green-900 rounded w-1/4"></div>
                       <div className="h-6 bg-gray-200 dark:bg-green-900 rounded w-1/3"></div>
                     </div>
                     <div className="h-6 bg-gray-200 dark:bg-green-900 rounded w-3/4"></div>
                     <div className="h-4 bg-gray-200 dark:bg-green-900 rounded w-1/2"></div>
                     <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-green-900 mt-4">
                       <div className="flex space-x-4 w-1/2">
                         <div className="h-4 bg-gray-200 dark:bg-green-900 rounded w-8"></div>
                         <div className="h-4 bg-gray-200 dark:bg-green-900 rounded w-8"></div>
                         <div className="h-4 bg-gray-200 dark:bg-green-900 rounded w-12"></div>
                       </div>
                       <div className="h-6 bg-gray-200 dark:bg-green-900 rounded w-8"></div>
                     </div>
                  </div>
                </div>
             ))}
           </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-serif text-gray-500 mb-2">No properties found</h3>
              <p className="text-gray-400">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {properties.map((property, idx) => (
                 <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: idx * 0.05 }}
                 key={property.id} 
                 className="group block overflow-hidden bg-gray-50 dark:bg-green-900/20 rounded-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-green-900/50"
               >
                 <Link to={`/properties/${property.id}`}>
                   <div className="relative h-56 overflow-hidden">
                     <img 
                       src={property.images?.[0] || getYoutubeThumbnail(property.youtubeUrl) || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                       alt={property.title} 
                       className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                     />
                     <div className="absolute bottom-4 right-4 bg-green-950/90 text-white px-3 py-1 font-serif text-lg border border-gold-500/30 shadow-lg">
                       ₹{(property.price / 10000000).toFixed(2)} Cr
                     </div>
                   </div>
                   <div className="p-6">
                     <div className="uppercase tracking-widest text-xs text-gold-500 font-bold mb-2">{property.type}</div>
                     <h3 className="text-xl font-serif text-green-950 dark:text-white mb-2 group-hover:text-gold-500 transition-colors line-clamp-1">{property.title}</h3>
                     <p className="flex items-center text-gray-500 text-sm mb-4">
                       <MapPin size={16} className="mr-1 text-gold-500" /> {property.location}
                     </p>
                     <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-green-900/50 pt-4">
                       {(property.type === 'apartment' || property.type === 'villa') && (
                         <>
                           <span>{property.bedrooms} Beds</span>
                           <span>{property.bathrooms} Baths</span>
                         </>
                       )}
                       <span>{property.areaSqft} sqft</span>
                     </div>
                   </div>
                 </Link>
               </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
