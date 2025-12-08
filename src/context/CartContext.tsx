"use client"

import React, { createContext, useContext, useReducer } from "react"
import type { CartItem, CartState, PricingType } from "@/lib/types"

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "CLEAR_CART" }
  | {
      type: "UPDATE_QUANTITY"
      payload: { activityId: string; pricingType: PricingType; quantity: number }
    }
  | {
      type: "REMOVE_ITEM"
      payload: { activityId: string; pricingType: PricingType }
    }

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const item = action.payload
      console.log("ADD_ITEM reducer:", item)

      const existing = state.items.find(
        (i) =>
          i.activityId === item.activityId &&
          i.pricingType === item.pricingType
      )

      if (existing) {
        const diff = item.quantity
        return {
          ...state,
          items: state.items.map((i) =>
            i.activityId === item.activityId &&
            i.pricingType === item.pricingType
              ? { ...i, quantity: i.quantity + diff }
              : i
          ),
          totalAmount: state.totalAmount + item.unitPrice * diff,
          totalItems: state.totalItems + diff,
        }
      }

      return {
        ...state,
        items: [...state.items, item],
        totalAmount: state.totalAmount + item.unitPrice * item.quantity,
        totalItems: state.totalItems + item.quantity,
      }
    }

    case "CLEAR_CART":
      return initialState

    case "UPDATE_QUANTITY": {
      const { activityId, pricingType, quantity } = action.payload
      if (quantity < 1) return state

      const existing = state.items.find(
        (i) => i.activityId === activityId && i.pricingType === pricingType
      )

      if (!existing) return state

      const diff = quantity - existing.quantity

      return {
        ...state,
        items: state.items.map((i) =>
          i.activityId === activityId && i.pricingType === pricingType
            ? { ...i, quantity }
            : i
        ),
        totalAmount: state.totalAmount + existing.unitPrice * diff,
        totalItems: state.totalItems + diff,
      }
    }

    case "REMOVE_ITEM": {
      const { activityId, pricingType } = action.payload
      const item = state.items.find(
        (i) => i.activityId === activityId && i.pricingType === pricingType
      )

      if (!item) return state

      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.activityId === activityId && i.pricingType === pricingType)
        ),
        totalAmount: state.totalAmount - item.unitPrice * item.quantity,
        totalItems: state.totalItems - item.quantity,
      }
    }

    default:
      return state
  }
}

interface CartContextValue {
  state: CartState
  addItem: (item: CartItem) => void
  clearCart: () => void
  updateQuantity: (
    activityId: string,
    pricingType: PricingType,
    quantity: number
  ) => void
  removeItem: (activityId: string, pricingType: PricingType) => void
  showToast: (message: string) => void
  toastMessage: string | null
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const value: CartContextValue = {
    state,
    addItem: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
    clearCart: () => dispatch({ type: "CLEAR_CART" }),
    updateQuantity: (activityId, pricingType, quantity) =>
      dispatch({ type: "UPDATE_QUANTITY", payload: { activityId, pricingType, quantity } }),
    removeItem: (activityId, pricingType) =>
      dispatch({ type: "REMOVE_ITEM", payload: { activityId, pricingType } }),
    showToast,
    toastMessage,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          {toastMessage}
        </div>
      )}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return ctx
}
