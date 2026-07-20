"use client";

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";

export interface InquiryCartItem {
  productId: string;
  productName: string;
  lengthCm: number;
  color: string;
  quantity: number;
  unit: "g" | "ks";
  sku?: string;
  pricePerUnit?: number; // halere per gram or per piece (retail)
}

interface CartState {
  items: InquiryCartItem[];
  loaded: boolean;
}

type CartAction =
  | { type: "SET"; items: InquiryCartItem[] }
  | { type: "ADD"; item: InquiryCartItem }
  | { type: "REMOVE"; productId: string; lengthCm: number; color: string }
  | { type: "UPDATE_QTY"; productId: string; lengthCm: number; color: string; quantity: number }
  | { type: "CLEAR" };

function cartKey(productId: string, lengthCm: number, color: string) {
  return `${productId}:${lengthCm}:${color}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET":
      return { items: action.items, loaded: true };
    case "ADD": {
      const key = cartKey(action.item.productId, action.item.lengthCm, action.item.color);
      const existing = state.items.findIndex(
        (i) => cartKey(i.productId, i.lengthCm, i.color) === key
      );
      if (existing >= 0) {
        const updated = [...state.items];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + action.item.quantity };
        return { ...state, items: updated };
      }
      return { ...state, items: [...state.items, action.item] };
    }
    case "REMOVE": {
      const key = cartKey(action.productId, action.lengthCm, action.color);
      return { ...state, items: state.items.filter((i) => cartKey(i.productId, i.lengthCm, i.color) !== key) };
    }
    case "UPDATE_QTY": {
      const key = cartKey(action.productId, action.lengthCm, action.color);
      return {
        ...state,
        items: state.items.map((i) =>
          cartKey(i.productId, i.lengthCm, i.color) === key ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
}

interface InquiryCartContextType {
  items: InquiryCartItem[];
  addItem: (item: InquiryCartItem) => void;
  removeItem: (productId: string, lengthCm: number, color: string) => void;
  updateQuantity: (productId: string, lengthCm: number, color: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
}

const InquiryCartContext = createContext<InquiryCartContextType | null>(null);

const STORAGE_KEY = "hairland-inquiry-cart";

export function InquiryCartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], loaded: false });

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        dispatch({ type: "SET", items: JSON.parse(stored) });
      } else {
        dispatch({ type: "SET", items: [] });
      }
    } catch {
      dispatch({ type: "SET", items: [] });
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (state.loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    }
  }, [state.items, state.loaded]);

  const value: InquiryCartContextType = {
    items: state.items,
    addItem: (item) => dispatch({ type: "ADD", item }),
    removeItem: (productId, lengthCm, color) => dispatch({ type: "REMOVE", productId, lengthCm, color }),
    updateQuantity: (productId, lengthCm, color, quantity) =>
      dispatch({ type: "UPDATE_QTY", productId, lengthCm, color, quantity }),
    clearCart: () => dispatch({ type: "CLEAR" }),
    itemCount: state.items.length,
  };

  return <InquiryCartContext.Provider value={value}>{children}</InquiryCartContext.Provider>;
}

export function useInquiryCart() {
  const ctx = useContext(InquiryCartContext);
  if (!ctx) throw new Error("useInquiryCart must be used within InquiryCartProvider");
  return ctx;
}
