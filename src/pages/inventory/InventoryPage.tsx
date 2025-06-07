import React, { useEffect, useState } from 'react';
import { Package, TrendingDown, TrendingUp, AlertTriangle, Plus, Minus, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { InventoryRepository } from '../../data/repositories/InventoryRepository';
import { ProductRepository } from '../../data/repositories/ProductRepository';
import { Product } from '../../data/models/Product';
import { InventoryMovement } from '../../data/models/InventoryMovement';
import { format } from 'date-fns';

function InventoryPage() {
  const { setTitle } = useApp();
  const { user, hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([]);
  const [stockValue, setStockValue] = useState<any>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'set'>('increase');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    setTitle('Inventory Management');
    loadData();
  }, [setTitle]);

  const loadData = async () => {
    try {
      const [allProducts, lowStock, movements, valueReport] = await Promise.all([
        ProductRepository.findAll(),
        InventoryRepository.getLowStockProducts(10),
        InventoryRepository.getAllMovements(),
        InventoryRepository.getStockValueReport()
      ]);

      setProducts(allProducts);
      setLowStockProducts(lowStock);
      setRecentMovements(movements.slice(0, 20)); // Last 20 movements
      setStockValue(valueReport);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !user) return;
    
    const quantity = parseFloat(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (!adjustmentReason.trim()) {
      alert('Please provide a reason for the adjustment');
      return;
    }

    const success = await InventoryRepository.createStockAdjustment(
      selectedProduct.id,
      adjustmentType,
      quantity,
      adjustmentReason,
      user.id,
      `${user.firstName} ${user.lastName}`
    );

    if (success) {
      setShowAdjustModal(false);
      resetAdjustmentForm();
      await loadData();
    } else {
      alert('Failed to create stock adjustment');
    }
  };

  const resetAdjustmentForm = () => {
    setSelectedProduct(null);
    setAdjustmentType('increase');
    setAdjustmentQuantity('');
    setAdjustmentReason('');
  };

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'sale': return <TrendingDown className="text-red-500\" size={16} />;
      case 'restock': return <TrendingUp className="text-green-500" size={16} />;
      case 'adjustment': return <RotateCcw className="text-blue-500" size={16} />;
      case 'return': return <TrendingUp className="text-yellow-500" size={16} />;
      default: return <Package className="text-slate-500" size={16} />;
    }
  };

  const canAdjustInventory = hasPermission('inventory.adjust');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
      </div>

      {/* Summary Cards */}
      {stockValue && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Products</p>
                <p className="text-2xl font-bold">{stockValue.totalProducts}</p>
              </div>
              <Package className="text-blue-500" size={32} />
            </div>
          </div>
          
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Stock Value</p>
                <p className="text-2xl font-bold">${stockValue.totalStockValue.toFixed(2)}</p>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </div>
          </div>
          
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Cost Value</p>
                <p className="text-2xl font-bold">${stockValue.totalCostValue.toFixed(2)}</p>
              </div>
              <TrendingDown className="text-orange-500" size={32} />
            </div>
          </div>
          
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="text-red-500" size={32} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="card">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-lg flex items-center">
              <AlertTriangle className="text-red-500 mr-2" size={20} />
              Low Stock Alert
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {lowStockProducts.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-slate-500">{product.category}</p>
                      <p className="text-sm text-red-600">Stock: {product.stock}</p>
                    </div>
                    {canAdjustInventory && (
                      <button
                        onClick={() => openAdjustModal(product)}
                        className="btn btn-sm btn-primary"
                      >
                        Adjust
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <AlertTriangle size={48} className="mx-auto mb-4 text-slate-300" />
                <p>No low stock items</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Movements */}
        <div className="card">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-lg">Recent Movements</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {recentMovements.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {recentMovements.map((movement) => (
                  <div key={movement.id} className="p-4 flex items-center space-x-3">
                    {getMovementIcon(movement.movementType)}
                    <div className="flex-1">
                      <p className="font-medium">{movement.productName}</p>
                      <p className="text-sm text-slate-500">
                        {movement.movementType.charAt(0).toUpperCase() + movement.movementType.slice(1)}
                        {movement.reason && ` - ${movement.reason}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {format(movement.createdAt, 'PPp')} by {movement.userName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </p>
                      <p className="text-xs text-slate-500">
                        Stock: {movement.newStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Package size={48} className="mx-auto mb-4 text-slate-300" />
                <p>No recent movements</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Adjust Stock</h2>
              
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
                <h3 className="font-medium">{selectedProduct.name}</h3>
                <p className="text-sm text-slate-500">Current Stock: {selectedProduct.stock}</p>
              </div>
              
              <form onSubmit={handleStockAdjustment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Adjustment Type
                  </label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as 'increase' | 'decrease' | 'set')}
                    className="input"
                  >
                    <option value="increase">Increase Stock</option>
                    <option value="decrease">Decrease Stock</option>
                    <option value="set">Set Stock Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    required
                    className="input"
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reason *
                  </label>
                  <textarea
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    required
                    rows={3}
                    className="input resize-none"
                    placeholder="Reason for adjustment (required)"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustModal(false);
                      resetAdjustmentForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Apply Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;