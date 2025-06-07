import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, DollarSign, ChevronLeft, Receipt } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { SaleRepository } from '../../data/repositories/SaleRepository';
import { ProductRepository } from '../../data/repositories/ProductRepository';
import { Sale, PaymentDetails } from '../../data/models/Sale';

type PaymentMethod = 'cash' | 'eft' | 'split';

function PaymentPage() {
  const { setTitle } = useApp();
  const { items, subtotal, tax, total, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [eftAmount, setEftAmount] = useState('');
  const [eftReference, setEftReference] = useState('');
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitEftAmount, setSplitEftAmount] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saleId, setSaleId] = useState('');
  const [completedPaymentDetails, setCompletedPaymentDetails] = useState<PaymentDetails | null>(null);
  
  useEffect(() => {
    setTitle('Payment');
    
    // Redirect if cart is empty
    if (items.length === 0 && !isCompleted) {
      navigate('/sales');
    }
  }, [setTitle, items, navigate, isCompleted]);
  
  // Calculate change for cash payment
  useEffect(() => {
    if (paymentMethod === 'cash' && cashAmount) {
      const cashValue = parseFloat(cashAmount);
      if (!isNaN(cashValue) && cashValue >= total) {
        setChangeAmount(cashValue - total);
      } else {
        setChangeAmount(0);
      }
    } else if (paymentMethod === 'split' && splitCashAmount && splitEftAmount) {
      const cashValue = parseFloat(splitCashAmount);
      const eftValue = parseFloat(splitEftAmount);
      const totalPaid = cashValue + eftValue;
      
      if (!isNaN(totalPaid) && totalPaid >= total) {
        setChangeAmount(totalPaid - total);
      } else {
        setChangeAmount(0);
      }
    } else {
      setChangeAmount(0);
    }
  }, [paymentMethod, cashAmount, splitCashAmount, splitEftAmount, total]);
  
  // Update split EFT amount when cash amount changes
  useEffect(() => {
    if (paymentMethod === 'split' && splitCashAmount) {
      const cashValue = parseFloat(splitCashAmount);
      if (!isNaN(cashValue)) {
        const remainingAmount = Math.max(0, total - cashValue);
        setSplitEftAmount(remainingAmount.toFixed(2));
      }
    }
  }, [paymentMethod, splitCashAmount, total]);
  
  // Process payment
  const handlePayment = async () => {
    if (items.length === 0) return;
    
    let isValid = true;
    let errorMessage = '';

    // --- Robust Validation --- 
    if (paymentMethod === 'cash') {
      const cashValue = parseFloat(cashAmount);
      if (isNaN(cashValue) || cashValue < total) {
        isValid = false;
        errorMessage = 'Cash amount must be a valid number equal to or greater than the total.';
      }
    } else if (paymentMethod === 'eft') {
      if (!eftReference || eftReference.trim() === '') {
        isValid = false;
        errorMessage = 'Please enter an EFT reference.';
      }
    } else if (paymentMethod === 'split') {
      const cashValue = parseFloat(splitCashAmount);
      const eftValue = parseFloat(splitEftAmount);
      
      if (isNaN(cashValue) || cashValue < 0) {
        isValid = false;
        errorMessage = 'Split cash amount must be a valid number.';
      } else if (isNaN(eftValue) || eftValue < 0) {
        isValid = false;
        errorMessage = 'Split EFT amount must be a valid number.';
      } else if ((cashValue + eftValue) < total) {
        isValid = false;
        errorMessage = 'Total split payment amount must be equal to or greater than the total.';
      } else if (!eftReference || eftReference.trim() === '') {
        isValid = false;
        errorMessage = 'Please enter an EFT reference for the split payment.';
      }
    }
    // --- End Validation ---
    
    // If validation fails, show message and exit
    if (!isValid) {
      alert(errorMessage);
      return;
    }
    
    // --- Proceed with payment processing --- 
    setIsProcessing(true);
    
    try {
      // Create payment details
      let paymentDetails: PaymentDetails = {};
      
      if (paymentMethod === 'cash') {
        paymentDetails = {
          cashAmount: parseFloat(cashAmount),
          changeAmount
        };
      } else if (paymentMethod === 'eft') {
        paymentDetails = {
          eftAmount: total,
          eftReference
        };
      } else if (paymentMethod === 'split') {
        paymentDetails = {
          cashAmount: parseFloat(splitCashAmount),
          eftAmount: parseFloat(splitEftAmount),
          changeAmount,
          eftReference
        };
      }
      
      // Create the sale object
      const sale: Omit<Sale, 'id' | 'date'> = {
        total,
        subtotal,
        tax,
        paymentMethod,
        paymentDetails,
        status: 'completed',
        items
      };
      
      // Save the sale to the database
      const newSale = await SaleRepository.create(sale);
      
      // Update product stock
      for (const item of items) {
        ProductRepository.updateStock(item.productId, -item.quantity);
      }
      
      // Set completed state
      setSaleId(newSale.id);
      setCompletedPaymentDetails(paymentDetails);
      setIsCompleted(true);
      clearCart();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('An error occurred while processing the payment. Please try again.');
    }
    
    setIsProcessing(false);
  };
  
  // Handle printing receipt
  const handlePrintReceipt = () => {
    if (saleId) {
      // In a real app, this would trigger receipt printing
      console.log('Printing receipt for sale:', saleId);
      alert('Receipt printed successfully.');
    }
  };
  
  // Reset payment form
  const resetPayment = () => {
    setIsCompleted(false);
    setCashAmount('');
    setEftAmount('');
    setEftReference('');
    setSplitCashAmount('');
    setSplitEftAmount('');
    setChangeAmount(0);
    navigate('/sales');
  };
  
  if (isCompleted) {
    return (
      <div className="max-w-lg mx-auto card p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Transaction has been completed.</p>
        
        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400">Total Amount:</span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-slate-600 dark:text-slate-400">Payment Method:</span>
            <span>{paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'eft' ? 'EFT' : 'Split Payment'}</span>
          </div>
          {completedPaymentDetails?.cashAmount && completedPaymentDetails.cashAmount > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-slate-600 dark:text-slate-400">Cash Given:</span>
              <span>${completedPaymentDetails.cashAmount.toFixed(2)}</span>
            </div>
          )}
          {/* Show Change Due if applicable (use saved value) */}
          {completedPaymentDetails?.changeAmount && completedPaymentDetails.changeAmount > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-slate-600 dark:text-slate-400">Change:</span>
              <span>${completedPaymentDetails.changeAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Receipt ID:</span>
            <span className="font-mono text-sm">{saleId.slice(0, 8)}</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={handlePrintReceipt}
            className="btn btn-primary flex items-center justify-center"
          >
            <Receipt size={18} className="mr-2" />
            Print Receipt
          </button>
          
          <button
            onClick={resetPayment}
            className="btn btn-secondary"
          >
            New Sale
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/sales')}
        className="mb-6 flex items-center text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft size={16} className="mr-1" />
        Back to Cart
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
          
          <div className="flex flex-col space-y-3 mb-6">
            <button
              className={`p-4 border rounded-lg flex items-center ${
                paymentMethod === 'cash' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-slate-300 hover:border-primary-300'
              }`}
              onClick={() => setPaymentMethod('cash')}
            >
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                paymentMethod === 'cash' 
                  ? 'border-primary-500 bg-primary-500 text-white' 
                  : 'border-slate-300'
              }`}>
                {paymentMethod === 'cash' && <Check size={14} />}
              </div>
              <div className="flex items-center">
                <DollarSign size={20} className="mr-2 text-slate-600" />
                Cash
              </div>
            </button>
            
            <button
              className={`p-4 border rounded-lg flex items-center ${
                paymentMethod === 'eft' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-slate-300 hover:border-primary-300'
              }`}
              onClick={() => setPaymentMethod('eft')}
            >
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                paymentMethod === 'eft' 
                  ? 'border-primary-500 bg-primary-500 text-white' 
                  : 'border-slate-300'
              }`}>
                {paymentMethod === 'eft' && <Check size={14} />}
              </div>
              <div className="flex items-center">
                <CreditCard size={20} className="mr-2 text-slate-600" />
                Card/EFT
              </div>
            </button>
            
            <button
              className={`p-4 border rounded-lg flex items-center ${
                paymentMethod === 'split' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-slate-300 hover:border-primary-300'
              }`}
              onClick={() => setPaymentMethod('split')}
            >
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                paymentMethod === 'split' 
                  ? 'border-primary-500 bg-primary-500 text-white' 
                  : 'border-slate-300'
              }`}>
                {paymentMethod === 'split' && <Check size={14} />}
              </div>
              <div className="flex-1 flex items-center">
                <div className="flex items-center">
                  <CreditCard size={20} className="mr-1 text-slate-600" />
                  <span className="mr-1">+</span>
                  <DollarSign size={20} className="mr-2 text-slate-600" />
                </div>
                Split Payment
              </div>
            </button>
          </div>
          
          {/* Payment Details */}
          <div className="mt-6">
            <h3 className="font-medium mb-4">Payment Details</h3>
            
            {paymentMethod === 'cash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Cash Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="0.00"
                      className="input pl-8"
                    />
                  </div>
                </div>
                
                {changeAmount > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex justify-between font-medium">
                      <span>Change:</span>
                      <span className="text-green-700">${changeAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {paymentMethod === 'eft' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Transaction Reference</label>
                  <input
                    type="text"
                    value={eftReference}
                    onChange={(e) => setEftReference(e.target.value)}
                    placeholder="Enter transaction reference"
                    className="input"
                  />
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex justify-between font-medium">
                    <span>Total to Pay:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {paymentMethod === 'split' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Cash Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={total.toString()}
                      value={splitCashAmount}
                      onChange={(e) => setSplitCashAmount(e.target.value)}
                      placeholder="0.00"
                      className="input pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-700 mb-1">EFT Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={splitEftAmount}
                      onChange={(e) => setSplitEftAmount(e.target.value)}
                      placeholder="0.00"
                      className="input pl-8"
                      readOnly
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Transaction Reference</label>
                  <input
                    type="text"
                    value={eftReference}
                    onChange={(e) => setEftReference(e.target.value)}
                    placeholder="Enter transaction reference"
                    className="input"
                  />
                </div>
                
                {changeAmount > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex justify-between font-medium">
                      <span>Change:</span>
                      <span className="text-green-700">${changeAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div>
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="max-h-64 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between py-2 border-b border-slate-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-slate-500">${item.price.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <p className="font-medium">${item.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-xl">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handlePayment}
            disabled={isProcessing || items.length === 0}
            className="w-full btn btn-primary py-3 flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Processing...
              </>
            ) : (
              <>Complete Payment</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;