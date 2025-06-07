import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { ProductRepository } from '../data/repositories/ProductRepository';
import { Product } from '../data/models/Product';
import { useCart } from '../context/CartContext';

interface CategoryProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory: string | null;
  allCategories: string[];
}

function CategoryProductsModal({ 
  isOpen, 
  onClose, 
  initialCategory,
  allCategories 
}: CategoryProductsModalProps) {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update selected category when initialCategory prop changes (e.g., when opening the modal for a different category)
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Fetch products when the selected category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchProducts = async (category: string) => {
    setIsLoading(true);
    try {
      const categoryProducts = await ProductRepository.findByCategory(category);
      setProducts(categoryProducts);
    } catch (error) {
      console.error(`Error fetching products for category ${category}:`, error);
      setProducts([]); // Clear products on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySwitch = (category: string) => {
    setSelectedCategory(category);
  };

  const handleAddProduct = (product: Product) => {
    addItem(product);
    // Optional: Close modal after adding? Or provide feedback?
  };

  // Memoize sorted categories to prevent unnecessary re-sorting on re-renders
  const sortedCategories = useMemo(() => 
    [...allCategories].sort(), 
    [allCategories]
  );

  // Handle clicks on the backdrop to close the modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !selectedCategory) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Products in: {selectedCategory}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Category List */}
          <div className="w-1/4 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-sm font-semibold mb-3 text-slate-600 dark:text-slate-400 uppercase tracking-wider">Categories</h3>
            <ul className="space-y-1">
              {sortedCategories.map(category => (
                <li key={category}>
                  <button
                    onClick={() => handleCategorySwitch(category)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${ 
                      selectedCategory === category
                        ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title={category}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Content - Product List */}
          <div className="w-3/4 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : products.length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {products.map(product => (
                  <li key={product.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{product.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Stock: {product.stock} | ${product.price.toFixed(2)}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleAddProduct(product)}
                      className="btn btn-sm btn-secondary px-2 py-1 text-xs"
                    >
                      <Plus size={14} className="mr-1"/> Add
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-slate-500 dark:text-slate-400 py-10">
                No products found in this category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryProductsModal; 