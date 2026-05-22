import React, { createContext, useContext, useEffect, useState } from 'react';
import { SafeStorage } from '@/services/storage';
import { auth, hasFirebaseConfig } from '@/config/firebase';


type UserData = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  loginState: (userData: UserData, authToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hasOnboarded: boolean | null;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  loginState: async () => {},
  logout: async () => {},
  hasOnboarded: null,
  completeOnboarding: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const TOKEN_KEY = 'pulsona_jwt_token';
const USER_KEY = 'pulsona_user_data';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    console.log("[AuthContext] Initializing AuthProvider. hasFirebaseConfig:", hasFirebaseConfig, "auth:", !!auth);
    
    let isSettled = false;
    let timeoutId: any = null;

    const loadCachedAuth = async () => {
      if (isSettled) return;
      isSettled = true;
      console.log("[AuthContext] loadCachedAuth started");
      try {
        const storedToken = await SafeStorage.getItem(TOKEN_KEY);
        const storedUser = await SafeStorage.getItem(USER_KEY);
        const storedOnboarded = await SafeStorage.getItem('pulsona_onboarded');
        console.log("[AuthContext] loadCachedAuth loaded storage. storedToken:", !!storedToken, "storedUser:", !!storedUser, "storedOnboarded:", storedOnboarded);
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
        setHasOnboarded(storedOnboarded === 'true');
      } catch (e) {
        console.error('[AuthContext] Failed to load local auth credentials', e);
        setHasOnboarded(false);
      } finally {
        console.log("[AuthContext] loadCachedAuth completed. Setting isLoading to false");
        setIsLoading(false);
      }
    };

    if (hasFirebaseConfig && auth) {
      try {
        const authInstance = auth();
        console.log("[AuthContext] Firebase authInstance obtained:", !!authInstance);
        if (!authInstance) {
          console.log("[AuthContext] authInstance is null, falling back to local storage");
          loadCachedAuth();
          return;
        }

        // Start safety timeout
        timeoutId = setTimeout(() => {
          if (!isSettled) {
            console.log("[AuthContext] Firebase Auth initialization timed out after 2000ms. Falling back to local cache.");
            loadCachedAuth();
          }
        }, 2000);

        const unsubscribe = authInstance.onAuthStateChanged(async (fbUser: any) => {
          console.log("[AuthContext] onAuthStateChanged fired. fbUser:", fbUser ? fbUser.uid : "null", "already settled:", isSettled);
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }

          if (isSettled) {
            if (fbUser) {
              try {
                const t = await fbUser.getIdToken();
                const userToken = `Bearer ${t}`;
                const userData = { id: fbUser.uid, name: fbUser.displayName || 'User', email: fbUser.email! };
                setToken(userToken);
                setUser(userData);
                console.log("[AuthContext] Post-settle Firebase login. Caching credentials.");
                await SafeStorage.setItem(TOKEN_KEY, userToken);
                await SafeStorage.setItem(USER_KEY, JSON.stringify(userData));
              } catch(e) {
                console.error("[AuthContext] Post-settle Firebase token error", e);
              }
            }
            return;
          }

          isSettled = true;

          if (fbUser) {
            try {
              const t = await fbUser.getIdToken();
              const userToken = `Bearer ${t}`;
              const userData = { id: fbUser.uid, name: fbUser.displayName || 'User', email: fbUser.email! };
              setToken(userToken);
              setUser(userData);
              console.log("[AuthContext] Firebase login detected. Caching credentials.");
              // Cache in SafeStorage for consistency
              await SafeStorage.setItem(TOKEN_KEY, userToken);
              await SafeStorage.setItem(USER_KEY, JSON.stringify(userData));
            } catch(e) {
              console.error("[AuthContext] Firebase Auth Context Token load error", e);
            }
          } else {
            console.log("[AuthContext] No Firebase user. Falling back to local storage.");
            // Fallback to local storage (handles mock auth fallback)
            try {
              const storedToken = await SafeStorage.getItem(TOKEN_KEY);
              const storedUser = await SafeStorage.getItem(USER_KEY);
              if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                console.log("[AuthContext] Found local session in storage");
              } else {
                setToken(null);
                setUser(null);
                console.log("[AuthContext] No local session found");
              }
            } catch (e) {
              console.error("[AuthContext] Local fallback error", e);
              setToken(null);
              setUser(null);
            }
          }
          
          try {
            const storedOnboarded = await SafeStorage.getItem('pulsona_onboarded');
            console.log("[AuthContext] Onboarding storage check:", storedOnboarded);
            setHasOnboarded(storedOnboarded === 'true');
          } catch(e) {
            console.error("[AuthContext] Onboarding read error", e);
            setHasOnboarded(false);
          }
          console.log("[AuthContext] Setting isLoading to false");
          setIsLoading(false);
        });

        return () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          unsubscribe();
        };
      } catch (authError) {
        console.error("[AuthContext] Error setting up onAuthStateChanged, falling back to local cache", authError);
        loadCachedAuth();
      }
    } else {
      console.log("[AuthContext] Firebase not configured or auth helper missing. Using local storage.");
      loadCachedAuth();
    }
  }, []);

  const loginState = async (userData: UserData, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    
    await SafeStorage.setItem(TOKEN_KEY, authToken);
    await SafeStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const logout = async () => {
    if (hasFirebaseConfig && auth && auth()) {
      try {
        await auth().signOut();
      } catch (e) {
        console.warn("Failed to sign out from Firebase:", e);
      }
    }
    
    setUser(null);
    setToken(null);
    
    await SafeStorage.deleteItem(TOKEN_KEY);
    await SafeStorage.deleteItem(USER_KEY);
    await SafeStorage.deleteItem('pulsona_onboarded');
    setHasOnboarded(null);
  };


  const completeOnboarding = async () => {
    setHasOnboarded(true);
    await SafeStorage.setItem('pulsona_onboarded', 'true');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, loginState, logout, hasOnboarded, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};
