import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SearchProvider } from './contexts/SearchContext';
import { CartProvider } from './contexts/CartContext'
import AppRoutes from './Navigation/AppRoutes';
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <AppRoutes/>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;