import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, Plus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductRepository } from '../../data/repositories/ProductRepository';
import { Product, PriceBreak } from '../../data/models/Product';

function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const { setTitle } = useApp();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    barcode: '',
    price: 0,
    costPrice: 0,
    gst: 0.1, // Default GST to 10%
    category: '',
    stock: 0,
    priceBreaks: []
  });
  
  const [newPriceBreak, setNewPriceBreak] = useState<Partial<PriceBreak>>({
    quantity: 0,
    price: 0
  });
  
  useEffect(() => {
    setTitle(isEditing ? 'Edit Product' : 'Add Product');
    
    if (isEditing && id) {
      const fetchProduct = async () => {
        const product = await ProductRepository.findById(id);
        
        if (product) {
          setFormData(product);
        } else {
          // Product not found, redirect to products page
          navigate('/products');
        }
      };
      fetchProduct();
    }
  }, [setTitle, isEditing, id, navigate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Convert to number for number inputs
    const convertedValue = type === 'number' ? parseFloat(value) : value;
    
    setFormData({
      ...formData,
      [name]: convertedValue
    });
  };
  
  const handlePriceBreakChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setNewPriceBreak({
      ...newPriceBreak,
      [name]: parseFloat(value)
    });
  };
  
  const addPriceBreak = () => {
    if (!newPriceBreak.quantity || !newPriceBreak.price) return;
    
    setFormData({
      ...formData,
      priceBreaks: [
        ...(formData.priceBreaks || []),
        newPriceBreak as PriceBreak
      ]
    });
    
    // Reset the form
    setNewPriceBreak({
      quantity: 0,
      price: 0
    });
  };
  
  const removePriceBreak = (index: number) => {
    const updatedPriceBreaks = [...(formData.priceBreaks || [])];
    updatedPriceBreaks.splice(index, 1);
    
    setFormData({
      ...formData,
      priceBreaks: updatedPriceBreaks
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || formData.price === undefined || formData.costPrice === undefined) {
      alert('Please fill in all required fields.');
      return;
    }
    
    try {
      if (isEditing && id) {
        // Update existing product
        await ProductRepository.update(id, formData);
      } else {
        // Create new product
        await ProductRepository.create(formData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
      }
      
      // Redirect back to products page
      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('An error occurred while saving the product. Please try again.');
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/products')}
        className="mb-6 flex items-center text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft size={16} className="mr-1" />
        Back to Products
      </button>
      
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 text-slate-800 dark:text-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Barcode / SKU
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode || ''}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={3}
                className="input resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                className="input"
                placeholder="e.g., Beverages, Snacks, Electronics"
              />
            </div>
          </div>
          
          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 text-slate-800 dark:text-white">Pricing Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Selling Price *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleInputChange}
                    required
                    className="input pl-8"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cost Price *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="costPrice"
                    value={formData.costPrice || ''}
                    onChange={handleInputChange}
                    required
                    className="input pl-8"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  GST (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    name="gst"
                    value={formData.gst || 0.1}
                    onChange={handleInputChange}
                    className="input pr-8"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-slate-500">%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Enter as a decimal (e.g., 0.1 for 10%)</p>
              </div>
            </div>
          </div>
          
          {/* Stock Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 text-slate-800 dark:text-white">Stock Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                min="0"
                name="stock"
                value={formData.stock || 0}
                onChange={handleInputChange}
                className="input"
              />
            </div>
          </div>
          
          {/* Price Breaks */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 text-slate-800 dark:text-white">Price Breaks (Bulk Pricing)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Quantity
                </label>
                <input
                  type="number"
                  min="2"
                  name="quantity"
                  value={newPriceBreak.quantity || ''}
                  onChange={handlePriceBreakChange}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Price Per Unit
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={newPriceBreak.price || ''}
                    onChange={handlePriceBreakChange}
                    className="input pl-8"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={addPriceBreak}
              className="btn btn-secondary"
            >
              <Plus size={16} className="mr-1" />
              Add Price Break
            </button>
            
            {/* Price Breaks Table */}
            {formData.priceBreaks && formData.priceBreaks.length > 0 && (
              <div className="mt-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border-b py-2 px-4 text-left">Quantity</th>
                      <th className="border-b py-2 px-4 text-left">Price</th>
                      <th className="border-b py-2 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.priceBreaks.map((priceBreak, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2 px-4">
                          {priceBreak.quantity}+ units
                        </td>
                        <td className="py-2 px-4">
                          ${priceBreak.price.toFixed(2)} each
                        </td>
                        <td className="py-2 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => removePriceBreak(index)}
                            className="p-1 text-slate-400 hover:text-error-600"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <Save size={18} className="mr-1" />
              {isEditing ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;