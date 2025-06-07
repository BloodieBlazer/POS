import React, { useEffect, useState } from 'react';
import { Clock, DollarSign, TrendingUp, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useShift } from '../../context/ShiftContext';
import { ShiftRepository } from '../../data/repositories/ShiftRepository';
import { Shift } from '../../data/models/Shift';
import { format } from 'date-fns';

function ShiftsPage() {
  const { setTitle } = useApp();
  const { user, hasPermission } = useAuth();
  const { currentShift, startShift, endShift } = useShift();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [pendingShifts, setPendingShifts] = useState<Shift[]>([]);

  useEffect(() => {
    setTitle('Shift Management');
    loadShifts();
    if (hasPermission('shifts.manage')) {
      loadPendingShifts();
    }
  }, [setTitle, hasPermission]);

  const loadShifts = async () => {
    try {
      const allShifts = await ShiftRepository.findAll();
      setShifts(allShifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    }
  };

  const loadPendingShifts = async () => {
    try {
      const pending = await ShiftRepository.getPendingApproval();
      setPendingShifts(pending);
    } catch (error) {
      console.error('Error loading pending shifts:', error);
    }
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(openingBalance);
    
    if (isNaN(balance) || balance < 0) {
      alert('Please enter a valid opening balance');
      return;
    }

    const success = await startShift(balance);
    if (success) {
      setShowStartModal(false);
      setOpeningBalance('');
      await loadShifts();
    } else {
      alert('Failed to start shift');
    }
  };

  const handleEndShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(closingBalance);
    
    if (isNaN(balance) || balance < 0) {
      alert('Please enter a valid closing balance');
      return;
    }

    const success = await endShift(balance, notes);
    if (success) {
      setShowEndModal(false);
      setClosingBalance('');
      setNotes('');
      await loadShifts();
      await loadPendingShifts();
    } else {
      alert('Failed to end shift');
    }
  };

  const handleApproveShift = async (shiftId: string) => {
    if (window.confirm('Are you sure you want to approve this shift?')) {
      const success = await ShiftRepository.approveShift(shiftId);
      if (success) {
        await loadShifts();
        await loadPendingShifts();
      } else {
        alert('Failed to approve shift');
      }
    }
  };

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'pending_approval': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getShiftStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'pending_approval': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold">Shift Management</h1>
        
        <div className="flex space-x-2">
          {!currentShift ? (
            <button
              onClick={() => setShowStartModal(true)}
              className="btn btn-primary"
            >
              <Clock size={18} className="mr-1" />
              Start Shift
            </button>
          ) : (
            <button
              onClick={() => setShowEndModal(true)}
              className="btn btn-warning"
            >
              <CheckCircle size={18} className="mr-1" />
              End Shift
            </button>
          )}
        </div>
      </div>

      {/* Current Shift Status */}
      {currentShift && (
        <div className="card p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">Current Shift Active</h3>
              <p className="text-green-600">
                Started: {format(currentShift.startTime, 'PPp')}
              </p>
              <p className="text-green-600">
                Opening Balance: ${currentShift.openingBalance.toFixed(2)}
              </p>
            </div>
            <div className="text-green-600">
              <Clock size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals (Manager/Admin only) */}
      {hasPermission('shifts.manage') && pendingShifts.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-lg">Shifts Pending Approval</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {pendingShifts.map((shift) => (
              <div key={shift.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{shift.userName}</p>
                  <p className="text-sm text-slate-500">
                    {format(shift.startTime, 'PPp')} - {shift.endTime && format(shift.endTime, 'PPp')}
                  </p>
                  <p className="text-sm text-red-600">
                    Variance: ${shift.variance?.toFixed(2)} 
                    (Expected: ${shift.expectedBalance?.toFixed(2)}, Actual: ${shift.closingBalance?.toFixed(2)})
                  </p>
                </div>
                <button
                  onClick={() => handleApproveShift(shift.id)}
                  className="btn btn-primary btn-sm"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shifts History */}
      <div className="card">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-lg">Shift History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">User</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Start Time</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">End Time</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Sales</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Variance</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">{shift.userName}</td>
                  <td className="py-3 px-4">{format(shift.startTime, 'PPp')}</td>
                  <td className="py-3 px-4">
                    {shift.endTime ? format(shift.endTime, 'PPp') : 'Active'}
                  </td>
                  <td className="py-3 px-4">
                    {shift.totalSales ? `$${shift.totalSales.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {shift.variance !== undefined ? (
                      <span className={shift.variance === 0 ? 'text-green-600' : 'text-red-600'}>
                        ${shift.variance.toFixed(2)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getShiftStatusColor(shift.status)}`}>
                      {getShiftStatusIcon(shift.status)}
                      <span className="ml-1 capitalize">{shift.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start Shift Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Start New Shift</h2>
              
              <form onSubmit={handleStartShift} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Opening Cash Balance *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      required
                      className="input pl-8"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Count the cash in the till before starting your shift
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowStartModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Start Shift
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* End Shift Modal */}
      {showEndModal && currentShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">End Current Shift</h2>
              
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
                <h3 className="font-medium mb-2">Shift Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span>{format(currentShift.startTime, 'PPp')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Opening Balance:</span>
                    <span>${currentShift.openingBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleEndShift} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Closing Cash Balance *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={closingBalance}
                      onChange={(e) => setClosingBalance(e.target.value)}
                      required
                      className="input pl-8"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Count the cash in the till at the end of your shift
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="input resize-none"
                    placeholder="Any notes about the shift..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEndModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning"
                  >
                    End Shift
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

export default ShiftsPage;