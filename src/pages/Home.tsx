import { motion } from 'motion/react';
import { Search, MapPin, Building2, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { getYoutubeThumbnail } from '../lib/utils';

export function Home() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<any[]>([]);
  const [videoProperties, setVideoProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(collection(db, 'properties'), where('status', '==', 'available'), limit(6));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFeatured(docs);
        
        // Fetch properties with videos
        const vProps = docs.filter(p => (p as any).youtubeUrl && (p as any).youtubeUrl.trim() !== '');
        
        setVideoProperties(vProps.slice(0, 3));
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSearch = (e: import('react').FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const params = new URLSearchParams();
    
    if (formData.get('location')) params.append('location', formData.get('location') as string);
    if (formData.get('type')) params.append('type', formData.get('type') as string);
    if (formData.get('budget')) params.append('budget', formData.get('budget') as string);
    
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[calc(100vh-80px)] min-h-[600px] w-full flex items-center justify-center bg-green-950 overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-transparent to-transparent"></div>
        
        <div className="relative z-10 text-center flex flex-col items-center px-4 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <span className="text-gold-500 uppercase tracking-[0.4em] text-xs font-bold mb-4">Prestige Real Estate</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif italic text-white mb-12 max-w-2xl leading-tight">
              Find Your Dream Property in <span className="text-gold-500 border-b-2 border-gold-500">Bhubaneswar</span>
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="w-full max-w-4xl"
          >
            <form onSubmit={handleSearch} className="bg-white p-2 shadow-2xl flex flex-col md:flex-row items-center gap-4 w-full border border-gray-100 mx-auto">
              <div className="flex-1 flex flex-col px-4 py-2 text-left border-b md:border-b-0 md:border-r border-gray-100 w-full">
                <label className="text-[10px] uppercase font-bold text-gray-400">Location</label>
                <input 
                  type="text" 
                  name="location"
                  placeholder="Patia, Khandagiri..." 
                  className="w-full text-sm font-semibold text-green-950 focus:outline-none placeholder:font-normal placeholder:text-gray-300 bg-transparent"
                />
              </div>
              <div className="flex-1 flex flex-col px-4 py-2 text-left border-b md:border-b-0 md:border-r border-gray-100 w-full">
                <label className="text-[10px] uppercase font-bold text-gray-400">Property Type</label>
                <select name="type" className="w-full text-sm font-semibold text-green-950 focus:outline-none appearance-none bg-transparent">
                  <option value="">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Luxury Villa</option>
                  <option value="plot">Plot / Land</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div className="flex-1 flex flex-col px-4 py-2 text-left border-b md:border-b-0 md:border-r border-gray-100 w-full hidden md:flex">
                <label className="text-[10px] uppercase font-bold text-gray-400">Max Budget</label>
                <input 
                  type="number"
                  name="budget"
                  placeholder="Enter max amount (₹)"
                  className="w-full text-sm font-semibold text-green-950 focus:outline-none placeholder:font-normal placeholder:text-gray-300 bg-transparent"
                />
              </div>
              <button type="submit" className="bg-green-950 text-gold-500 h-12 px-8 font-bold uppercase tracking-widest hover:bg-green-900 transition-colors w-full md:w-auto shrink-0 flex items-center justify-center">
                Search
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Featured Properties Sector */}
      <section className="flex-1 bg-[#f9f9f7] px-4 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12 border-b border-gray-200 pb-4">
            <div className="flex flex-col">
              <h2 className="text-3xl font-serif italic text-green-950">Available Properties</h2>
              <div className="w-12 h-1 bg-gold-500 mt-3"></div>
            </div>
            <Link to="/properties" className="text-xs font-bold uppercase tracking-widest text-gold-500 hover:text-gold-400 transition-colors hidden sm:block">
              View All Collections &rarr;
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[400px] bg-gray-200 border border-gray-100"></div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No featured properties found. Be the first to add one!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map((property, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  key={property.id} 
                  className="bg-white border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-shadow duration-300"
                >
                  <Link to={`/properties/${property.id}`} className="block">
                    <div className="h-56 bg-gray-200 relative overflow-hidden">
                      <img 
                        src={property.images?.[0] || getYoutubeThumbnail(property.youtubeUrl) || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                        alt={property.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {property.featured && (
                        <div className="absolute top-4 left-4 bg-gold-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-tighter">
                          Featured
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <h3 className="font-bold text-sm uppercase tracking-wide text-green-950 group-hover:text-gold-500 transition-colors line-clamp-1">{property.title}</h3>
                        <span className="text-gold-500 font-bold text-sm shrink-0">₹{(property.price / 10000000).toFixed(2)} Cr</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-6 flex items-center">
                        <MapPin size={12} className="mr-1 inline-block" /> {property.location}
                      </p>
                      <div className="flex justify-between text-[10px] uppercase font-bold text-green-950 border-t border-gray-100 pt-5">
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
          
          <div className="text-center mt-12 sm:hidden">
            <Link to="/properties" className="inline-block text-xs font-bold uppercase tracking-widest text-gold-500 border-b border-gold-500 pb-1">
              View All Collections
            </Link>
          </div>

          {/* Video Tours Section */}
          {!loading && videoProperties.length > 0 && (
            <div className="mt-20">
              <div className="flex flex-col mb-10">
                <h2 className="text-3xl font-serif italic text-green-950">Property Video Tours</h2>
                <div className="w-12 h-1 bg-gold-500 mt-3"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videoProperties.map((property: any, idx: number) => {
                  let videoId = '';
                  try {
                    const url = new URL(property.youtubeUrl);
                    if (url.hostname.includes('youtube.com')) {
                      videoId = url.searchParams.get('v') || '';
                    } else if (url.hostname.includes('youtu.be')) {
                      videoId = url.pathname.slice(1);
                    }
                  } catch (e) {
                    // Invalid URL
                  }
                  
                  return (
                    <motion.div 
                      key={`video-${property.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white border border-gray-100 shadow-sm overflow-hidden"
                    >
                      <div className="h-56 relative w-full bg-black">
                        {videoId ? (
                          <iframe 
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}`} 
                            title={property.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            Invalid Video URL
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <Link to={`/properties/${property.id}`} className="hover:text-gold-500 transition-colors">
                          <h4 className="font-bold text-sm uppercase tracking-wide text-green-950 line-clamp-1">{property.title}</h4>
                          <p className="text-xs text-gray-500 mt-2 flex items-center">
                            <MapPin size={12} className="mr-1 inline-block" /> {property.location}
                          </p>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
