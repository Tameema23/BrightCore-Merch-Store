import { createContext, useContext, useState } from 'react'

const CartContext = createContext()

export function useCart() {
  return useContext(CartContext)
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState([]) // [{ variant_id, product_name, size_code, color_name, color_code, image_url, price, quantity }]

  function addItem(newItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i.variant_id === newItem.variant_id)
      if (existing) {
        return prev.map((i) =>
          i.variant_id === newItem.variant_id
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        )
      }
      return [...prev, newItem]
    })
  }

  function removeItem(variant_id) {
    setItems((prev) => prev.filter((i) => i.variant_id !== variant_id))
  }

  function updateQuantity(variant_id, quantity) {
    if (quantity < 1) {
      removeItem(variant_id)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.variant_id === variant_id ? { ...i, quantity } : i))
    )
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}