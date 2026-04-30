import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { Trash2, Plus, Edit, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export function AdminDashboard() {
  const { user } = useAuthStore();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'properties' | 'leads'>('properties');
  const [leads, setLeads] = useState<any[]>([]);

  const defaultForm = {
    title: '', description: '', price: 0, location: '', 
    type: 'apartment', bedrooms: 0, bathrooms: 0, areaSqft: 0, 
    images: [] as string[], 
    amenities: [] as string[], 
    youtubeUrl: '',
    status: 'available', featured: false
  };
  
  const [form, setForm] = useState(defaultForm);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'properties'));
      const snapshot = await getDocs(q);
      setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const q = query(collection(db, 'messages'));
      const snapshot = await getDocs(q);
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error("Error fetching leads:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'properties') fetchProperties();
    if (activeTab === 'leads') fetchLeads();
  }, [activeTab]);

  const handleImageUpload = async (e: import('react').ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingImages(true);
    const newImages: string[] = [];

    try {
      const fileArray = Array.from(files) as File[];
      for (const file of fileArray) {
        const fileRef = ref(storage, `properties/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        newImages.push(downloadUrl);
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    } catch (err: any) {
      console.error("Error uploading images:", err);
      if (err.message?.includes('unauthorized') || err.message?.includes('retry time')) {
        alert("Upload failed. Please ensure Firebase Storage is ENABLED in your Firebase Console, and that your Storage Security Rules allow uploads.");
      } else {
        alert("Failed to upload images. Check console for details.");
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const handleGenerateDescription = async () => {
    if (!form.type || !form.location) {
      alert("Please fill in at least Property Type and Location to generate a description.");
      return;
    }

    setGeneratingDesc(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Write a compelling, SEO-friendly premium real estate property description for a ${form.bedrooms} BHK ${form.type} located in ${form.location}. ${form.price > 0 ? `Price is ₹${form.price}.` : ''} ${form.areaSqft > 0 ? `Area is ${form.areaSqft} sqft.` : ''} Keep it under 200 words, use an elegant tone appropriate for a premium real estate agency named PropertyDekho.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      if (response.text) {
         setForm(prev => ({ ...prev, description: response.text || '' }));
      }
    } catch (err) {
      console.error("AI Generation Error:", err);
      alert("Failed to generate description. Please check console.");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSave = async (e: import('react').FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const id = editId || Date.now().toString();
      const payload = {
        ...form,
        price: Number(form.price),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        areaSqft: Number(form.areaSqft),
        ownerId: user.uid,
        updatedAt: Date.now(),
        createdAt: editId ? (properties.find(p => p.id === id)?.createdAt || Date.now()) : Date.now()
      };
      
      await setDoc(doc(db, 'properties', id), payload);
      setIsEditing(false);
      setEditId(null);
      setForm(defaultForm);
      fetchProperties();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'properties');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      await deleteDoc(doc(db, 'properties', id));
      fetchProperties();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `properties/${id}`);
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: string, notes: string, oldData: any) => {
    try {
      await setDoc(doc(db, 'messages', id), {
        ...oldData,
        status,
        notes
      });
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert('Failed to update lead');
    }
  };

  const startEdit = (p: any) => {
    setForm({
      title: p.title, description: p.description, price: p.price, location: p.location,
      type: p.type, bedrooms: p.bedrooms, bathrooms: p.bathrooms, areaSqft: p.areaSqft,
      images: p.images, status: p.status, featured: p.featured || false,
      youtubeUrl: p.youtubeUrl || '',
      amenities: p.amenities || []
    });
    setEditId(p.id);
    setIsEditing(true);
  };

  return (
    <div className="bg-gray-50 dark:bg-green-950 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-6 items-baseline">
            <h1 className="text-3xl font-serif text-green-950 dark:text-white">Admin Dashboard</h1>
            <div className="flex space-x-4 border-b border-gray-200 dark:border-green-900 pb-1">
              <button 
                onClick={() => setActiveTab('properties')}
                className={`text-sm font-bold uppercase tracking-wider ${activeTab === 'properties' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-gray-500 hover:text-green-950 dark:hover:text-white'}`}
              >
                Properties
              </button>
              <button 
                onClick={() => setActiveTab('leads')}
                className={`text-sm font-bold uppercase tracking-wider ${activeTab === 'leads' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-gray-500 hover:text-green-950 dark:hover:text-white'}`}
              >
                Leads (CRM)
              </button>
            </div>
          </div>
          {!isEditing && activeTab === 'properties' && (
            <button 
              onClick={() => { setForm(defaultForm); setEditId(null); setIsEditing(true); }}
              className="bg-gold-500 text-green-950 px-4 py-2 flex items-center font-bold uppercase tracking-widest text-sm rounded-sm hover:bg-gold-400 transition-colors"
            >
              <Plus size={18} className="mr-2" /> Add Property
            </button>
          )}
        </div>

        {activeTab === 'properties' ? (
          isEditing ? (
          <div className="bg-white dark:bg-green-900/20 p-8 rounded-sm shadow-sm border border-gray-200 dark:border-green-900">
            <h2 className="text-2xl font-serif mb-6 dark:text-white">{editId ? 'Edit Property' : 'Add New Property'}</h2>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none" />
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateDescription}
                    disabled={generatingDesc}
                    className="flex items-center text-xs font-bold text-gold-500 hover:text-gold-400 uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {generatingDesc ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />}
                    {generatingDesc ? 'Generating...' : 'Auto-Generate'}
                  </button>
                </div>
                <textarea required rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none resize-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                <input required type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input required type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none">
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="plot">Plot</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none">
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4 md:col-span-2">
                {(form.type === 'apartment' || form.type === 'villa') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bedrooms</label>
                      <input required type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: Number(e.target.value)})} className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bathrooms</label>
                      <input required type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: Number(e.target.value)})} className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none" />
                    </div>
                  </>
                )}
                <div className={(form.type !== 'apartment' && form.type !== 'villa') ? "col-span-3" : ""}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area (sqft)</label>
                  <input required type="number" value={form.areaSqft} onChange={e => setForm({...form, areaSqft: Number(e.target.value)})} className="w-full bg-white dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Images</label>
                <div className="flex flex-wrap gap-4">
                  {form.images.map((imgUrl, idx) => (
                    <div key={idx} className="relative group w-24 h-24 border rounded-sm overflow-hidden">
                      <img src={imgUrl} alt="Property" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-green-800 rounded-sm flex flex-col justify-center items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-green-900/30 transition-colors">
                    {uploadingImages ? <Loader2 className="animate-spin text-gray-400" size={24} /> : <Plus className="text-gray-400" size={24} />}
                    <input type="file" multiple accept="image/*" className="hidden" disabled={uploadingImages} onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">YouTube Video URL (Optional)</label>
                <input 
                  type="url" 
                  value={form.youtubeUrl} 
                  onChange={e => setForm({...form, youtubeUrl: e.target.value})} 
                  className="w-full bg-gray-50 dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500" 
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amenities</label>
                <div className="flex flex-wrap gap-6">
                  {['Swimming Pool', 'Gym', 'Parking', 'Power Backup', 'Security', 'Garden', 'Elevator', 'Clubhouse'].map(amenity => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={form.amenities?.includes(amenity) || false}
                         onChange={(e) => {
                           if (e.target.checked) {
                             setForm({...form, amenities: [...(form.amenities || []), amenity]});
                           } else {
                             setForm({...form, amenities: (form.amenities || []).filter(a => a !== amenity)});
                           }
                         }}
                         className="w-4 h-4 text-gold-500 bg-gray-100 border-gray-300 rounded focus:ring-gold-500 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                       />
                       <span className="text-sm text-gray-700 dark:text-gray-300">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex items-center mt-2">
                <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="mr-2 w-4 h-4 text-gold-500 bg-gray-100 border-gray-300 rounded focus:ring-gold-500 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">Feature on Home Page</label>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-4 mt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-sm text-sm uppercase tracking-widest dark:text-white">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-gold-500 text-green-950 font-bold rounded-sm text-sm uppercase tracking-widest hover:bg-gold-400">Save Property</button>
              </div>

            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-green-900/20 rounded-sm shadow-sm border border-gray-200 dark:border-green-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-green-900/50 text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">Loading...</td>
                    </tr>
                  ) : properties.map((p) => (
                    <tr key={p.id} className="border-b border-gray-200 dark:border-green-900/50 hover:bg-gray-50 dark:hover:bg-green-900/30">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center">
                        <ImageIcon size={16} className="mr-2 text-gray-400" />
                        <span className="line-clamp-1">{p.title}</span>
                        {p.featured && <span className="ml-2 text-[10px] bg-gold-500 text-green-950 px-2 py-0.5 rounded-sm uppercase font-bold">Featured</span>}
                      </td>
                      <td className="px-6 py-4">₹{(p.price/100000).toFixed(2)} L</td>
                      <td className="px-6 py-4 capitalize">{p.status}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => startEdit(p)} className="text-blue-500 hover:text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {!loading && properties.length === 0 && (
                     <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">No properties found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )
        ) : (
          <div className="bg-white dark:bg-green-900/20 rounded-sm shadow-sm border border-gray-200 dark:border-green-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-green-900/50 text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-4">Lead Info</th>
                    <th className="px-6 py-4">Message</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Internal Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-200 dark:border-green-900/50 hover:bg-gray-50 dark:hover:bg-green-900/30">
                      <td className="px-6 py-4 align-top">
                        <div className="font-medium text-gray-900 dark:text-white">{lead.name}</div>
                        <div className="text-xs text-gray-400">{lead.email}</div>
                        <div className="text-xs text-gray-400">{lead.phone}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{new Date(lead.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 align-top max-w-xs whitespace-pre-wrap">{lead.message}</td>
                      <td className="px-6 py-4 align-top">
                        <select 
                          value={lead.status || 'new'}
                          onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value, lead.notes || '', lead)}
                          className="bg-gray-50 dark:bg-green-900 border border-gray-200 dark:border-green-800 rounded py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold-500"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <textarea 
                          rows={2}
                          value={lead.notes || ''}
                          onChange={(e) => handleUpdateLeadStatus(lead.id, lead.status || 'new', e.target.value, lead)}
                          placeholder="Add notes..."
                          className="w-full bg-gray-50 dark:bg-green-900 border border-gray-200 dark:border-green-800 rounded py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 resize-none"
                        ></textarea>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                     <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">No leads found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
