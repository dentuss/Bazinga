import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from './AuthContext';

interface WishlistItem {
  id: string;
  title: string;
  image: string;
  creators: string;
  price: number;
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);

  const mapApiItems = (response: any[]) =>
    response.map((item) => ({
      id: item.comic.id.toString(),
      title: item.comic.title,
      image: item.comic.image,
      creators: item.comic.author || "",
      price: Number(item.comic.price || 0),
    }));

  useEffect(() => {
    const loadWishlist = async () => {
      if (!token) {
        setItems([]);
        return;
      }
      const response = await apiFetch<any[]>("/api/wishlist", { authToken: token });
      setItems(mapApiItems(response));
    };

    loadWishlist().catch(() => setItems([]));
  }, [token]);

  const addToWishlist = (item: WishlistItem) => {
    if (!token) return;
    apiFetch<any[]>("/api/wishlist", {
      method: "POST",
      authToken: token,
      body: JSON.stringify({ comicId: Number(item.id) }),
    }).then((res) => {
      setItems(mapApiItems(res));
    });
  };

  const removeFromWishlist = (id: string) => {
    if (!token) return;
    apiFetch<any[]>(`/api/wishlist/${id}`, { method: "DELETE", authToken: token }).then((res) => {
      setItems(mapApiItems(res));
    });
  };

  const isInWishlist = (id: string) => {
    return items.some((item) => item.id === id);
  };

  const totalItems = items.length;

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist, totalItems }}>
      {children}
    </WishlistContext.Provider>
  );
};
