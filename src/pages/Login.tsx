import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, googleProvider } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Mail, Lock, User } from 'lucide-react';

export function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      
      // Check if user profile exists, if not create one
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName || 'User',
          role: 'user', // Default role is user. Admin bootstrapped elsewhere.
          createdAt: Date.now()
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during Google authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (mode === 'signup' && !name) {
      setError('Please provide a full name.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: name,
          role: 'user',
          createdAt: Date.now()
        });
        navigate('/');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      let message = err.message || 'An error occurred during authentication.';
      if (err.code === 'auth/email-already-in-use') message = 'This email is already in use.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') message = 'Invalid email or password.';
      if (err.code === 'auth/weak-password') message = 'Password should be at least 6 characters.';
      if (err.code === 'auth/operation-not-allowed') message = 'Email/password authentication is not enabled. Please enable it in the Firebase Console.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-green-950 min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-green-900/20 p-8 rounded-sm shadow-xl border border-gray-100 dark:border-green-900 text-center">
        <h2 className="text-3xl font-serif text-green-950 dark:text-white mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <p className="text-gray-500 mb-8 text-sm">
          {mode === 'login' 
            ? 'Sign in to save your favorite properties and connect with agents.' 
            : 'Join PropertyDekho to start your real estate journey.'}
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-3 mb-6 rounded-sm text-sm border-l-4 border-red-500 text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 text-left mb-6">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 bg-gray-50 dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none text-gray-800 dark:text-gray-200"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 bg-gray-50 dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none text-gray-800 dark:text-gray-200"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 bg-gray-50 dark:bg-green-950 border border-gray-300 dark:border-green-900 rounded-sm py-2 px-3 text-sm focus:ring-1 focus:ring-gold-500 outline-none text-gray-800 dark:text-gray-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 text-green-950 font-bold uppercase tracking-widest py-3 rounded-sm transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-green-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-[#071b12] text-gray-500">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full mb-6 border-2 border-gray-200 hover:border-green-950 dark:border-green-800 dark:hover:border-gold-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-green-900/30 font-medium py-2 rounded-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="text-gold-500 hover:text-gold-400 font-bold ml-1 transition-colors"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </div>
    </div>
  );
}
