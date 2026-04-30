import { create } from 'zustand';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthState {
  user: User | null;
  role: 'admin' | 'user' | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  checkRole: (uid: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,
  setUser: (user) => set({ user, loading: user === null ? false : true }),
  checkRole: async (uid: string) => {
    try {
      const user = auth.currentUser;
      if (user?.email === 'plotbbsr9@gmail.com') {
        set({ role: 'admin', loading: false });
        return;
      }
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        set({ role: docSnap.data().role, loading: false });
      } else {
        set({ role: 'user', loading: false });
      }
    } catch (e) {
      console.error(e);
      set({ role: 'user', loading: false });
    }
  }
}));

// Initialize auth listener
auth.onAuthStateChanged((user) => {
  useAuthStore.getState().setUser(user);
  if (user) {
    useAuthStore.getState().checkRole(user.uid);
  } else {
    useAuthStore.setState({ role: null, loading: false });
  }
});
