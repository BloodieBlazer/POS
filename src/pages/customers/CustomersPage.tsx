import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash, CreditCard, User, Phone, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerRepository } from '../../data/repositories/CustomerRepository';
import { Customer } from '../../data/models/Customer';
import { useAuth } from '../../context/AuthContext';

function CustomersPage() {
  const { setTitle } = useApp();
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    creditBalance: 0
  });

  useEffect(() => {
    setTitle('Customers');
    loadCustomers();
  }, [setTitle]);

  const loadCustomers = async () => {
    try {
      const allCustomers = await CustomerRepository.findAll();
      setCustomers(allCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  // Filter customers based on search query
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(customer =>
        customer.firstName.toLowerCase().includes(query) ||
        customer.lastName.toLowerCase().includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(query)) ||
        (customer.phone && customer.phone.includes(query))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCustomer) {
        await CustomerRepository.update(editingCustomer.id, formData);
      } else {
        await CustomerRepository.create({
          ...formData,
          totalPurchases: 0
        });
      }
      
      await loadCustomers();
      resetForm();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      creditBalance: 0
    });
    setEditingCustomer(null);
    setShowAddModal(false);
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      creditBalance: customer.creditBalance
    });
    setEditingCustomer(customer);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await CustomerRepository.delete(id);
        await loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer');
      }
    }
  };

  const canManageCustomers = hasPermission('customers.manage');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold">Customers</h1>
        
        {canManageCustomers && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary md:w-auto w-full"
          >
            <Plus size={18} className="mr-1" />
            Add Customer
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search customers..."
          className="input pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <User size={24} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  <div className={`text-sm ${customer.creditBalance > 0 ? 'text-green-600' : customer.creditBalance < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                    Credit: ${customer.creditBalance.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {canManageCustomers && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-1.5 rounded-md hover:bg-red-100 text-slate-600 hover:text-red-600"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              {customer.email && (
                <div className="flex items-center text-slate-600">
                  <Mail size={14} className="mr-2" />
                  {customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center text-slate-600">
                  <Phone size={14} className="mr-2" />
                  {customer.phone}
                </div>
              )}
              <div className="flex items-center text-slate-600">
                <CreditCard size={14} className="mr-2" />
                Total Purchases: ${customer.totalPurchases.toFixed(2)}
              </div>
            </div>

            {customer.lastPurchaseDate && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  Last Purchase: {customer.lastPurchaseDate.toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No customers found</h3>
          <p className="text-slate-500">
            {searchQuery ? 'Try adjusting your search terms' : 'Add your first customer to get started'}
          </p>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="input resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Initial Credit Balance
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.creditBalance}
                      onChange={(e) => setFormData({ ...formData, creditBalance: parseFloat(e.target.value) || 0 })}
                      className="input pl-8"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingCustomer ? 'Update' : 'Create'} Customer
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

export default CustomersPage;