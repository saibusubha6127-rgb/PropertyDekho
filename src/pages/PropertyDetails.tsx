import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { MapPin, BedDouble, Bath, Square, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { PropertyMap } from '../components/PropertyMap';
import { getYoutubeThumbnail } from '../lib/utils';

export function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const { user } = useAuthStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperty() {
      if (!id) return;
      try {
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProperty({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `properties/${id}`);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

  useEffect(() => {
    async function checkFavorite() {
      if (!user || !id) return;
      try {
        const q = query(
          collection(db, `users/${user.uid}/favorites`),
          where('propertyId', '==', id)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setIsFavorite(true);
          setFavId(querySnapshot.docs[0].id);
        }
      } catch (err) {
        console.error("Fav check error", err);
      }
    }
    checkFavorite();
  }, [user, id]);

  const toggleFavorite = async () => {
    if (!user) return alert("Please log in to save properties.");
    if (!id) return;

    try {
      if (isFavorite && favId) {
        await deleteDoc(doc(db, `users/${user.uid}/favorites`, favId));
        setIsFavorite(false);
        setFavId(null);
      } else {
        const newFavId = Date.now().toString();
        await setDoc(doc(db, `users/${user.uid}/favorites`, newFavId), {
          propertyId: id,
          createdAt: Date.now()
        });
        setIsFavorite(true);
        setFavId(newFavId);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/favorites`);
    }
  };

  const nextImage = () => {
    if (property?.images?.length > 1) {
      setCurrentImage((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images?.length > 1) {
      setCurrentImage((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
    }
  };

  if (loading) {
    return (
       <div className="bg-white dark:bg-green-950 min-h-screen pt-20 animate-pulse">
         <div className="w-full h-[60vh] bg-gray-200 dark:bg-green-900"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
           <div className="flex flex-col lg:flex-row gap-12">
             <div className="lg:w-2/3">
               <div className="h-6 bg-gray-200 dark:bg-green-900 rounded w-1/4 mb-4"></div>
               <div className="h-10 bg-gray-200 dark:bg-green-900 rounded w-3/4 mb-6"></div>
               <div className="flex space-x-6 pb-6 border-b border-gray-100 dark:border-green-900 mb-8">
                 <div className="h-6 bg-gray-200 dark:bg-green-900 rounded w-16"></div>
                 <div className="h-6 bg-gray-200 dark:bg-green-900 rounded w-16"></div>
                 <div className="h-6 bg-gray-200 dark:bg-green-900 rounded w-20"></div>
               </div>
               <div className="space-y-3">
                 <div className="h-4 bg-gray-200 dark:bg-green-900 rounded w-full"></div>
                 <div className="h-4 bg-gray-200 dark:bg-green-900 rounded w-full"></div>
                 <div className="h-4 bg-gray-200 dark:bg-green-900 rounded w-5/6"></div>
                 <div className="h-4 bg-gray-200 dark:bg-green-900 rounded w-full"></div>
                 <div className="h-4 bg-gray-200 dark:bg-green-900 rounded w-4/6"></div>
               </div>
             </div>
             <div className="lg:w-1/3">
                <div className="bg-gray-50 dark:bg-green-900/50 p-6 rounded-sm border border-gray-100 dark:border-green-900 h-80"></div>
             </div>
           </div>
         </div>
       </div>
    );
  }
  if (!property) return <div className="min-h-screen flex items-center justify-center text-gray-500">Property not found.</div>;

  return (
    <div className="bg-white dark:bg-green-950 min-h-screen">
      {/* Property Hero/Gallery */}
      <div className="relative h-[60vh] bg-green-950">
        {property.images && property.images.length > 0 ? (
          <>
            <img 
              src={property.images[currentImage]} 
              alt={property.title} 
              className="w-full h-full object-cover"
            />
            {property.images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-gold-500 transition-colors">
                  <ChevronLeft />
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-gold-500 transition-colors">
                  <ChevronRight />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 text-sm rounded-full backdrop-blur-sm">
                  {currentImage + 1} / {property.images.length}
                </div>
              </>
            )}
          </>
        ) : getYoutubeThumbnail(property.youtubeUrl) ? (
          <img 
            src={getYoutubeThumbnail(property.youtubeUrl) as string} 
            alt={property.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">No images available</div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Info */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-start mb-6">
              <div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="uppercase tracking-widest text-sm text-gold-500 font-bold mb-2">
                  {property.type}
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-serif text-green-950 dark:text-white mb-2">{property.title}</h1>
                <p className="flex items-center text-gray-500">
                  <MapPin size={18} className="mr-1 text-gold-500" /> {property.location}
                </p>
              </div>
              <button onClick={toggleFavorite} className="p-3 bg-gray-100 dark:bg-green-900/30 rounded-full hover:bg-gold-50 dark:hover:bg-green-900 transition-colors group">
                <Heart className={`transition-colors ${isFavorite ? 'fill-gold-500 text-gold-500' : 'text-gray-400 group-hover:text-gold-500'}`} />
              </button>
            </div>

            <div className="flex space-x-8 py-6 border-y border-gray-200 dark:border-green-900/50 mb-8">
              {(property.type === 'apartment' || property.type === 'villa') && (
                <>
                  <div className="flex items-center">
                    <BedDouble className="text-gold-500 mr-3" size={24} />
                    <div>
                      <p className="text-sm text-gray-500">Bedrooms</p>
                      <p className="font-bold text-lg dark:text-white">{property.bedrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Bath className="text-gold-500 mr-3" size={24} />
                    <div>
                      <p className="text-sm text-gray-500">Bathrooms</p>
                      <p className="font-bold text-lg dark:text-white">{property.bathrooms}</p>
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-center">
                <Square className="text-gold-500 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-500">Area</p>
                  <p className="font-bold text-lg dark:text-white">{property.areaSqft} <span className="text-sm font-normal text-gray-500">sqft</span></p>
                </div>
              </div>
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-serif mb-4 dark:text-white">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity: string, i: number) => (
                    <div key={i} className="flex items-center text-gray-600 dark:text-gray-300">
                      <div className="w-2 h-2 bg-gold-500 rounded-full mr-3"></div>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-12">
              <h3 className="text-2xl font-serif mb-4 dark:text-white">Description</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{property.description}</p>
            </div>

            {property.youtubeUrl && (
              <div className="mb-12">
                <h3 className="text-2xl font-serif mb-4 dark:text-white">Video Tour</h3>
                <div className="w-full aspect-video bg-black rounded-sm overflow-hidden border border-gray-200 dark:border-green-900">
                  <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${
                      (() => {
                        try {
                          const url = new URL(property.youtubeUrl);
                          if (url.hostname.includes('youtube.com')) {
                            return url.searchParams.get('v') || '';
                          } else if (url.hostname.includes('youtu.be')) {
                            return url.pathname.slice(1);
                          }
                        } catch (e) {
                          return '';
                        }
                        return '';
                      })()
                    }`} 
                    title={`${property.title} Video Tour`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {/* Map */}
            <div>
              <h3 className="text-2xl font-serif mb-4 dark:text-white">Location</h3>
              <PropertyMap location={property.location} />
            </div>
          </div>

          {/* Sidebar / Pricing */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-green-900/20 p-8 rounded-sm border border-gray-200 dark:border-green-900 sticky top-24">
              <p className="text-sm text-gray-500 mb-1">Asking Price</p>
              <h2 className="text-4xl font-serif text-green-950 dark:text-white mb-6">
                ₹{(property.price / 100000).toLocaleString('en-IN')} Lac
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between border-b border-gray-200 dark:border-green-900/50 pb-2">
                  <span className="text-gray-500">Status</span>
                  <span className="capitalize font-medium dark:text-white">{property.status}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 dark:border-green-900/50 pb-2">
                  <span className="text-gray-500">Property ID</span>
                  <span className="font-mono text-sm dark:text-white uppercase">{property.id.slice(0,8)}</span>
                </div>
              </div>

              <Link to={`/contact?property=${encodeURIComponent(property.title)}`} className="block w-full bg-gold-500 hover:bg-gold-400 text-green-950 text-center font-bold uppercase tracking-widest py-3 rounded-sm transition-colors mb-4 cursor-pointer">
                Contact Agent
              </Link>
              
              {/* EMI Calculator */}
              <div className="mt-8 border-t border-gray-100 dark:border-green-900 pt-6">
                <h3 className="text-xl font-serif text-green-950 dark:text-white mb-4">EMI Calculator</h3>
                <EMICalculator propertyPrice={property.price} />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function EMICalculator({ propertyPrice }: { propertyPrice: number }) {
  const [downpayment, setDownpayment] = useState(Math.round(propertyPrice * 0.2));
  const [interestRate, setInterestRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const P = propertyPrice - downpayment;
  const R = interestRate / 12 / 100;
  const N = years * 12;

  let emi = 0;
  if (P > 0 && R > 0 && N > 0) {
    emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm text-gray-500 mb-1 flex justify-between">
          <span>Downpayment</span>
          <span className="font-medium text-green-950 dark:text-white">₹{downpayment.toLocaleString('en-IN')}</span>
        </label>
        <input 
          type="range" 
          min={0} 
          max={propertyPrice} 
          step={100000} 
          value={downpayment} 
          onChange={(e) => setDownpayment(Number(e.target.value))}
          className="w-full accent-gold-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1 flex justify-between">
          <span>Interest Rate (%)</span>
          <span className="font-medium text-green-950 dark:text-white">{interestRate}%</span>
        </label>
        <input 
          type="range" 
          min={1} 
          max={20} 
          step={0.1} 
          value={interestRate} 
          onChange={(e) => setInterestRate(Number(e.target.value))}
          className="w-full accent-gold-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1 flex justify-between">
          <span>Loan Tenure (Years)</span>
          <span className="font-medium text-green-950 dark:text-white">{years} Years</span>
        </label>
        <input 
          type="range" 
          min={1} 
          max={30} 
          step={1} 
          value={years} 
          onChange={(e) => setYears(Number(e.target.value))}
          className="w-full accent-gold-500"
        />
      </div>
      
      <div className="pt-4 border-t border-gray-100 dark:border-green-900 mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-500 text-sm">Monthly EMI</span>
          <span className="text-2xl font-bold font-serif text-green-950 dark:text-gold-500">
            ₹{Math.round(emi).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Principal: ₹{P.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
