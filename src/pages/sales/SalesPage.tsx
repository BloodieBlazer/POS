import React, { useEffect, useState, useRef } from 'react';
import { X, Plus, Minus, Trash, Search, CreditCard, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { ProductRepository } from '../../data/repositories/ProductRepository';
import { Product } from '../../data/models/Product';
import CategoryProductsModal from '../../components/CategoryProductsModal';
import NotificationToast, { ToastType } from '../../components/NotificationToast';
import { useNotification } from '../../context/NotificationContext';

// Helper component for empty cart illustration (can be moved to a separate file)
const ShoppingCartEmpty = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

function SalesPage() {
  const { setTitle } = useApp();
  const { items, subtotal, tax, total, addItem, updateQuantity, removeItem, clearCart, proceedToPayment } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModalCategory, setSelectedModalCategory] = useState<string | null>(null);
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as ToastType,
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotification();
  const lowStockNotified = useRef<Set<string>>(new Set()); // Track notified products by id/barcode

  const showToast = (message: string, type: ToastType) => {
    setToast({
      isVisible: true,
      message,
      type,
    });
  };

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    setTitle('Sales Transaction');
    loadCategories();
    
    // Focus the barcode input when the component mounts
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [setTitle]);

  // Function to load unique categories from products
  const loadCategories = async () => {
    try {
      const allProducts = await ProductRepository.findAll();
      const uniqueCategories = Array.from(
        new Set(allProducts.map(p => p.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Handle barcode scan/input
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcodeInput.trim()) return;
    
    try {
      const product = await ProductRepository.findByBarcode(barcodeInput);
      
      if (product) {
        addItem(product);
        showToast(`${product.name} added to cart`, 'success');
        // Low stock notification (only once per product per session)
        if (product.stock <= 5 && !lowStockNotified.current.has(product.barcode || product.id)) {
          addNotification(`Stock low: ${product.name} (only ${product.stock} left)`, 'warning');
          lowStockNotified.current.add(product.barcode || product.id);
        }
        setBarcodeInput('');
      } else {
        showToast(`Product with barcode ${barcodeInput} not found`, 'error');
        setBarcodeInput('');
      }
    } catch (error) {
      console.error('Error finding product by barcode:', error);
      showToast('An error occurred while searching for the product', 'error');
    }
  };

  // Handle product search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length >= 1) {
      setIsSearching(true);
      try {
        const results = await ProductRepository.search(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      }
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  // Handle adding a product from search results
  const handleAddProduct = (product: Product) => {
    addItem(product);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    showToast(`${product.name} added to cart`, 'success');

    // Low stock notification (only once per product per session)
    if (product.stock <= 5 && !lowStockNotified.current.has(product.barcode || product.id)) {
      addNotification(`Stock low: ${product.name} (only ${product.stock} left)`, 'warning');
      lowStockNotified.current.add(product.barcode || product.id);
    }

    // Focus back on barcode input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle clicking a category button
  const handleCategoryClick = (category: string) => {
    setSelectedModalCategory(category);
    setIsModalOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <NotificationToast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={handleCloseToast}
      />
      {/* Left: Product Search and Results */}
      <div className="lg:col-span-2 space-y-4">
        {/* Apply card styles manually, omitting overflow-hidden */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          {/* Barcode Scanner Input */}
          <form onSubmit={handleBarcodeSubmit} className="mb-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode or enter product code"
                  className="input"
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Add
              </button>
            </div>
          </form>
          
          {/* Product Search */}
          <div className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search products by name..."
                className="input pl-10"
              />
              {searchQuery && (
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setIsSearching(false);
                  }}
                >
                  <X size={18} className="text-slate-400" />
                </button>
              )}
            </div>
            
            {/* Search Results */}
            {isSearching && (
              <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.length > 0 ? (
                  <ul className="py-1">
                    {searchResults.map((product) => (
                      <li 
                        key={product.id}
                        className="px-4 py-2 hover:bg-slate-100 cursor-pointer flex justify-between items-center"
                        onClick={() => handleAddProduct(product)}
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Stock: {product.stock} | ${product.price.toFixed(2)}
                          </p>
                        </div>
                        <button className="btn btn-sm btn-secondary">
                          <Plus size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-slate-500">
                    No products found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Cart Items */}
        <div className="card">
          <div className="flex justify-between items-center p-4 border-b border-slate-200">
            <h3 className="font-semibold dark:text-slate-100">Cart Items</h3>
            {items.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-sm text-slate-500 hover:text-error-600 flex items-center"
              >
                <Trash size={16} className="mr-1" />
                Clear All
              </button>
            )}
          </div>
          
          {items.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">${item.price.toFixed(2)} each</p>
                  </div>
                  
                  <div className="flex items-center">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-slate-100"
                    >
                      <Minus size={16} />
                    </button>
                    
                    <span className="mx-2 w-8 text-center">{item.quantity}</span>
                    
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-slate-100"
                    >
                      <Plus size={16} />
                    </button>
                    
                    <div className="ml-4 w-20 text-right">
                      ${item.total.toFixed(2)}
                    </div>
                    
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="ml-2 p-1 text-slate-400 hover:text-error-600"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <ShoppingCartEmpty />
              <p className="mt-2">No items in cart</p>
              <p className="text-sm">Scan barcode or search for products to add</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Right: Order Summary */}
      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="font-semibold mb-4 dark:text-slate-100">Order Summary</h3>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Subtotal</span>
              <span className="dark:text-slate-100">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Tax (10%)</span>
              <span className="dark:text-slate-100">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 flex justify-between font-bold dark:text-slate-100">
              <span>Total</span>
              <span className="text-xl dark:text-slate-100">${total.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            onClick={proceedToPayment}
            disabled={items.length === 0}
            className={`w-full btn ${items.length > 0 ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'} py-3 flex justify-center items-center`}
          >
            <CreditCard size={20} className="mr-2" />
            Proceed to Payment
          </button>
        </div>
        
        {/* Quick Add Product Categories */}
        <div className="card p-4">
          <h3 className="font-semibold mb-4 dark:text-slate-100">Quick Categories</h3>
          <div className="grid grid-cols-2 gap-2">
            {categories.length > 0 ? (
              categories.map((category) => (
                <button 
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-200 text-left truncate"
                  title={category}
                >
                  {category}
                </button>
              ))
            ) : (
              <p className="col-span-2 text-sm text-slate-500 text-center py-4">No categories found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Category Products Modal */}
      <CategoryProductsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCategory={selectedModalCategory}
        allCategories={categories}
      />
    </div>
  );
}

export default SalesPage;