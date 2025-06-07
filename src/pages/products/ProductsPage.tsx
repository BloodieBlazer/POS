import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash, Filter, ArrowUpDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductRepository } from '../../data/repositories/ProductRepository';
import { Product } from '../../data/models/Product';
import { useDatabase } from '../../context/DatabaseContext';

function ProductsPage() {
  const { setTitle } = useApp();
  const { isInitialized: dbIsInitialized } = useDatabase();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  useEffect(() => {
    setTitle('Products');
    if (dbIsInitialized) {
      loadProducts();
    }
  }, [setTitle, dbIsInitialized]);
  
  const loadProducts = async () => {
    try {
      const allProducts = await ProductRepository.findAll();
      setProducts(allProducts);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(allProducts.map(p => p.category).filter(Boolean))
      ) as string[];
      
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };
  
  // Filter and sort products when any filter or sort criteria changes
  useEffect(() => {
    let result = [...products];
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.barcode?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'stock') {
        comparison = a.stock - b.stock;
      } else if (sortBy === 'price') {
        comparison = a.price - b.price;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredProducts(result);
  }, [products, selectedCategory, searchQuery, sortBy, sortDirection]);
  
  const handleEditProduct = (id: string) => {
    navigate(`/products/${id}`);
  };
  
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const success = await ProductRepository.delete(id);
      
      if (success) {
        // Reload products after deletion
        await loadProducts();
      } else {
        alert('Failed to delete product.');
      }
    }
  };
  
  const toggleSort = (field: 'name' | 'stock' | 'price') => {
    if (sortBy === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold">Products</h1>
        
        <button
          onClick={() => navigate('/products/new')}
          className="btn btn-primary md:w-auto w-full"
        >
          <Plus size={18} className="mr-1" />
          Add Product
        </button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-40">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-slate-400" />
            </div>
            <select
              className="input pl-10 appearance-none pr-8"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">
                  <button 
                    className="flex items-center"
                    onClick={() => toggleSort('name')}
                  >
                    Product
                    <ArrowUpDown size={14} className="ml-1" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">
                  Category
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">
                  <button 
                    className="flex items-center"
                    onClick={() => toggleSort('price')}
                  >
                    Price
                    <ArrowUpDown size={14} className="ml-1" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">
                  <button 
                    className="flex items-center"
                    onClick={() => toggleSort('stock')}
                  >
                    Stock
                    <ArrowUpDown size={14} className="ml-1" />
                  </button>
                </th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 dark:hover:text-gray-900">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-slate-500">
                          {product.barcode ? `SKU: ${product.barcode}` : ''}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {product.category ? (
                        <span className="badge bg-slate-100 text-slate-700">
                          {product.category}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`
                        badge 
                        ${product.stock > 10 
                          ? 'bg-green-100 text-green-800' 
                          : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-error-100 text-error-800'
                        }
                      `}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEditProduct(product.id)}
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-gray-900 text-slate-600"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 rounded-md hover:bg-error-100 dark:hover:bg-error-700 dark:hover:text-gray-900 text-slate-600 hover:text-error-600"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    {searchQuery || selectedCategory !== 'all' ? (
                      <>No products matching your filters.</>
                    ) : (
                      <>No products found. Add your first product!</>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;