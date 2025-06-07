import React, { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, BarChart3, RefreshCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SaleRepository } from '../../data/repositories/SaleRepository';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

interface SalesSummary {
  total: number;
  count: number;
  avgTransaction: number;
}

function ReportsPage() {
  const { setTitle } = useApp();
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [salesData, setSalesData] = useState<SalesSummary>({
    total: 0,
    count: 0,
    avgTransaction: 0
  });
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);
  const [salesByHour, setSalesByHour] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  useEffect(() => {
    setTitle('Sales Reports');
    loadReportData();
  }, [setTitle, period, currentDate]);
  
  const loadReportData = async () => {
    setIsLoading(true);
    
    try {
      let startDate: Date;
      let endDate: Date;
      let displayPeriod: string;
      
      // Set date range based on selected period
      if (period === 'daily') {
        startDate = startOfDay(currentDate);
        endDate = endOfDay(currentDate);
        displayPeriod = format(currentDate, 'MMMM d, yyyy');
      } else if (period === 'weekly') {
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
        displayPeriod = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
      } else {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        displayPeriod = format(currentDate, 'MMMM yyyy');
      }
      
      // Get sales data for the period
      const sales = await SaleRepository.findAll(startDate, endDate);
      
      // Calculate summary
      const total = sales.reduce((sum, sale) => sum + sale.total, 0);
      const count = sales.length;
      const avgTransaction = count > 0 ? total / count : 0;
      
      setSalesData({
        total,
        count,
        avgTransaction
      });
      
      // Get best sellers
      const completedSales = sales.filter(sale => sale.status === 'completed');
      const topProducts = await SaleRepository.getBestSellers(startDate, endDate, 5);
      setBestSellers(topProducts);
      
      // Aggregate payment method breakdown (handling split payments)
      let totalCash = 0;
      let totalEft = 0;
      
      console.log('Processing sales for payment methods:', completedSales);
      
      completedSales.forEach(sale => {
        console.log('Sale:', sale.id, 'Method:', sale.paymentMethod, 'Details:', sale.paymentDetails, 'Total:', sale.total);
        if (sale.paymentMethod === 'cash') {
          totalCash += sale.total;
        } else if (sale.paymentMethod === 'eft') {
          totalEft += sale.total;
        } else if (sale.paymentMethod === 'split' && sale.paymentDetails) {
          // Ensure amounts are valid numbers before adding
          const cashAmt = Number(sale.paymentDetails.cashAmount);
          const eftAmt = Number(sale.paymentDetails.eftAmount);
          if (!isNaN(cashAmt)) {
            totalCash += cashAmt;
          }
          if (!isNaN(eftAmt)) {
            totalEft += eftAmt;
          }
          // Note: sale.total might not equal cashAmount + eftAmount if there was change involved,
          // but summing the paid amounts seems more accurate for payment method reporting.
        }
      });
      
      console.log('Aggregated Totals -> Cash:', totalCash, 'EFT:', totalEft);
      
      const aggregatedPaymentData = [];
      if (totalCash > 0) {
        aggregatedPaymentData.push({ name: 'Cash', value: totalCash });
      }
      if (totalEft > 0) {
        aggregatedPaymentData.push({ name: 'Card/EFT', value: totalEft });
      }
      
      console.log('Final Payment Chart Data:', aggregatedPaymentData);
      
      // Calculate sales by hour data from actual sales
      if (period === 'daily') {
        const hourlyTotals: { [hour: number]: number } = {};
        for (let i = 0; i < 24; i++) {
          hourlyTotals[i] = 0; // Initialize all hours to 0
        }
        
        completedSales.forEach(sale => {
          const hour = sale.date.getHours();
          hourlyTotals[hour] = (hourlyTotals[hour] || 0) + sale.total;
        });
        
        const hourlyData = Object.entries(hourlyTotals)
          .map(([hour, total]) => ({
            hour: parseInt(hour),
            sales: total
          }))
          // Optional: Filter to only show hours with sales or a specific range (e.g., 9 AM - 9 PM)
          // For now, let's show all hours for completeness, can be adjusted later
          .sort((a, b) => a.hour - b.hour); // Sort by hour
          
        setSalesByHour(hourlyData);
      } else {
        // Clear hourly data if not in daily view
        setSalesByHour([]);
      }
      
      // Set the calculated aggregated data
      setPaymentMethodData(aggregatedPaymentData);
    } catch (error) {
      console.error('Error loading report data:', error);
    }
    
    setIsLoading(false);
  };
  
  const formatPaymentMethod = (method: string): string => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'eft': return 'Card/EFT';
      case 'split': return 'Split Payment';
      default: return method;
    }
  };
  
  const navigatePrevious = () => {
    if (period === 'daily') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (period === 'weekly') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };
  
  const navigateNext = () => {
    if (period === 'daily') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (period === 'weekly') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };
  
  const setToday = () => {
    setCurrentDate(new Date());
  };
  
  // Get date range display
  const getDateRangeDisplay = () => {
    if (period === 'daily') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (period === 'weekly') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };
  
  // Handle date change from DatePicker
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setCurrentDate(date);
    }
    setShowDatePicker(false); // Close picker after selection
  };
  
  // Colors for pie chart
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadReportData}
            className="p-2 rounded-md hover:bg-slate-100"
            title="Refresh Data"
          >
            <RefreshCcw size={18} />
          </button>
          
          <button
            onClick={setToday}
            className="p-2 rounded-md hover:bg-slate-100"
            title="Go to Today"
          >
            <Calendar size={18} />
          </button>
        </div>
      </div>
      
      {/* Period Selection and Navigation */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex space-x-1 mb-4 md:mb-0">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-4 py-2 rounded-md ${
                period === 'daily' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-gray-900 dark:text-gray-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-4 py-2 rounded-md ${
                period === 'weekly' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-gray-900 dark:text-gray-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 rounded-md ${
                period === 'monthly' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-gray-900 dark:text-gray-900'
              }`}
            >
              Monthly
            </button>
          </div>
          
          <div className="flex items-center space-x-2 relative">
            <button
              onClick={navigatePrevious}
              className="p-1 rounded-md hover:bg-slate-100"
            >
              <ChevronLeft size={20} />
            </button>
            
            <span className="font-medium dark:text-slate-100 text-center min-w-[150px]">{getDateRangeDisplay()}</span>
            
            {/* Calendar Icon Button to trigger DatePicker */}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-1 rounded-md hover:bg-slate-100"
              title="Select Date"
            >
              <Calendar size={18} />
            </button>
            
            {/* DatePicker Component */}
            {showDatePicker && (
              <div className="z-50">
                <DatePicker
                  selected={currentDate}
                  onChange={handleDateChange}
                  showWeekNumbers={period === 'weekly'} // Show week numbers for weekly period
                  showMonthYearPicker={period === 'monthly'} // Show month picker for monthly period
                  calendarStartDay={1} // Start week on Monday
                  portalId="datepicker-portal" // Use portal
                  popperPlacement="bottom-end" // Position relative to the input/button
                />
              </div>
            )}
            
            <button
              onClick={navigateNext}
              className="p-1 rounded-md hover:bg-slate-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Sales Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <h3 className="text-sm text-slate-500 dark:text-slate-400">Total Sales</h3>
              <div className="text-3xl font-bold mt-2 dark:text-slate-100">${salesData.total.toFixed(2)}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Month'}
              </div>
            </div>
            
            <div className="card p-5">
              <h3 className="text-sm text-slate-500 dark:text-slate-400">Transactions</h3>
              <div className="text-3xl font-bold mt-2 dark:text-slate-100">{salesData.count}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Month'}
              </div>
            </div>
            
            <div className="card p-5">
              <h3 className="text-sm text-slate-500 dark:text-slate-400">Average Sale</h3>
              <div className="text-3xl font-bold mt-2 dark:text-slate-100">
                ${salesData.avgTransaction.toFixed(2)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Per transaction</div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Sellers */}
            <div className="card p-5">
              <h3 className="font-semibold mb-4 dark:text-slate-100">Best Selling Products</h3>
              
              {bestSellers.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bestSellers}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} />
                      <YAxis 
                        dataKey="productName" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        width={150}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} units`, 'Quantity']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar 
                        dataKey="quantity" 
                        fill="#3b82f6" 
                        radius={[0, 4, 4, 0]} 
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-slate-500 dark:text-slate-400">No data available</div>
                </div>
              )}
            </div>
            
            {/* Payment Methods */}
            <div className="card p-5">
              <h3 className="font-semibold mb-4 dark:text-slate-100">Payment Methods</h3>
              
              {paymentMethodData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-slate-500 dark:text-slate-400">No data available</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sales by Hour (Only for daily view) */}
          {period === 'daily' && (
            <div className="card p-5">
              <h3 className="font-semibold mb-4 dark:text-slate-100">Sales by Hour</h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesByHour}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="hour" 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Sales']}
                      labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar 
                      dataKey="sales" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]} 
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReportsPage;