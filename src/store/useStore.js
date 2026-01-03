import { create } from 'zustand';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, onSnapshot, query, collection, where, orderBy } from 'firebase/firestore';

const useStore = create((set, get) => ({
    user: null,
    profile: null,
    loading: true,
    initialized: false,

    // Auth Actions
    initializeAuth: () => {
        if (get().initialized) return;

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Fetch Profile
                    const profileDoc = await getDoc(doc(db, 'users', user.uid));
                    const profile = profileDoc.exists() ? profileDoc.data() : null;
                    set({ user, profile, loading: false, initialized: true });
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    set({ user, profile: null, loading: false, initialized: true });
                }
            } else {
                set({ user: null, profile: null, loading: false, initialized: true });
            }
        });
    },

    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),

    logout: async () => {
        await signOut(auth);
        set({ user: null, profile: null });
    },

    // Refresh Profile
    refreshProfile: async () => {
        const user = get().user;
        if (!user) return;
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
            set({ profile: profileDoc.data() });
        }
    }
}));

export default useStore;
