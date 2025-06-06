// frontend/src/contexts/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth to get the authenticated user and api instance
import axios from 'axios';

// 1. Create the Context
const CartContext = createContext(null);

// 2. Custom Hook to use the Cart Context
export const useCart = () => {
  return useContext(CartContext);
};

// 3. Cart Provider Component
export const CartProvider = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading, api } = useAuth(); // Get auth state and api instance from AuthContext
  const [cart, setCart] = useState(null); // Stores the entire cart object
  const [cartItems, setCartItems] = useState([]); // Stores just the items for easier rendering
  const [loading, setLoading] = useState(true); // Loading state for cart operations
  const [error, setError] = useState(null); // Error state for cart operations

  // Function to fetch the active cart
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !user?.id_usuario) {
      setCart(null);
      setCartItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/cart`);
      if (response.status === 200) {
        setCart(response.data.cart);
        setCartItems(response.data.cart ? response.data.cart.items : []);
      } else {
        setCart(null);
        setCartItems([]);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart. Please try again.');
      setCart(null);
      setCartItems([]);
      // If a 401 error occurs, the AuthContext interceptor will handle logout.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id_usuario, api]);

  // Effect to load cart when authentication state changes or on initial load
  useEffect(() => {
    if (!authLoading) { // Ensure AuthContext has finished loading
      fetchCart();
    }
  }, [isAuthenticated, user, authLoading, fetchCart]);

  // Add item to cart
  const addItem = useCallback(async (bookId, quantity = 1) => {
    if (!isAuthenticated) {
      setError('You must be logged in to add items to the cart.');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/cart/items', {
        book_id: bookId,
        quantity: quantity,
      });
      if (response.status === 200 || response.status === 201) {
        setCart(response.data.cart); // Update cart with the new state from the backend
        setCartItems(response.data.cart.items);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adding item to cart:', err);
      setError(err.response?.data?.message || 'Failed to add item to cart.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, api]);

  // Update item quantity in cart
  const updateItemQuantity = useCallback(async (bookId, quantity) => {
    if (!isAuthenticated) {
      setError('You must be logged in to update cart items.');
      return false;
    }
    if (quantity <= 0) {
        return removeItem(bookId); // If quantity is 0 or less, remove the item
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/cart/items/${bookId}`, {
        quantity: quantity,
      });
      if (response.status === 200) {
        setCart(response.data.cart);
        setCartItems(response.data.cart.items);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating item quantity:', err);
      setError(err.response?.data?.message || 'Failed to update item quantity.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, api]);

  // Remove item from cart
  const removeItem = useCallback(async (bookId) => {
    if (!isAuthenticated) {
      setError('You must be logged in to remove items from the cart.');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/cart/items/${bookId}`);
      if (response.status === 200) {
        setCart(response.data.cart);
        setCartItems(response.data.cart.items);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error removing item from cart:', err);
      setError(err.response?.data?.message || 'Failed to remove item from cart.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, api]);

  // Clear the entire cart
  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      setError('You must be logged in to clear the cart.');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete('/cart');
      if (response.status === 200) {
        setCart(null);
        setCartItems([]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err.response?.data?.message || 'Failed to clear cart.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, api]);

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const value = {
    cart,
    cartItems,
    cartItemCount,
    loading,
    error,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    fetchCart, // Expose fetchCart to allow manual refresh if needed
  };

  // Optionally, show a loading spinner while cart is being fetched initially
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-lime-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-700 text-lg">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
      <CartContext.Provider value={value}>
        {children}
      </CartContext.Provider>
  );
};