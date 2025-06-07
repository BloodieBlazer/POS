import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SaleRepository } from '../data/repositories/SaleRepository';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ErrorBoundary } from '../components/ErrorBoundary';

function DashboardContent() {
  const { currentTitle, setTitle } = useApp();
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState({
    todayTotal: 0,
    todayCount: 0,
    weekTotal: 0,
    monthTotal: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    setTitle('Dashboard');
    
    // Load sales data
    loadSalesData();
  }, [setTitle]);
  
  const loadSalesData = async () => {
    try {
      // Get today's data
      const today = new Date();
      const todaySales = await SaleRepository.getDailySales(today);
      
      // Get weekly data (last 7 days)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekSales = await SaleRepository.findAll(weekStart, today);
      const weekTotal = weekSales.reduce((sum, sale) => sum + sale.total, 0);
      
      // Get monthly data (last 30 days)
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);
      const monthSales = await SaleRepository.findAll(monthStart, today);
      const monthTotal = monthSales.reduce((sum, sale) => sum + sale.total, 0);
      
      setSalesData({
        todayTotal: todaySales.total,
        todayCount: todaySales.count,
        weekTotal,
        monthTotal
      });
      
      // Generate chart data for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
      }).reverse();
      
      const chartDataPromises = last7Days.map(async (date) => {
        const dayData = await SaleRepository.getDailySales(date);
        return {
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          sales: dayData.total
        };
      });
      
      const chartData = await Promise.all(chartDataPromises);
      
      setChartData(chartData);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  // Stats cards data
  const statCards = [
    {
      title: "Today's Sales",
      value: `$${salesData.todayTotal.toFixed(2)}`,
      subtitle: `${salesData.todayCount} transactions`,
      icon: <DollarSign className="text-green-500" />,
      trend: 12.3,
      trendUp: true
    },
    {
      title: "Weekly Sales",
      value: `$${salesData.weekTotal.toFixed(2)}`,
      subtitle: "Last 7 days",
      icon: <ShoppingBag className="text-blue-500" />,
      trend: 8.1,
      trendUp: true
    },
    {
      title: "Monthly Sales",
      value: `$${salesData.monthTotal.toFixed(2)}`,
      subtitle: "Last 30 days",
      icon: <CreditCard className="text-purple-500" />,
      trend: 5.4,
      trendUp: true
    },
    {
      title: "Avg. Transaction",
      value: `$${salesData.todayCount > 0 ? (salesData.todayTotal / salesData.todayCount).toFixed(2) : '0.00'}`,
      subtitle: "Per sale",
      icon: <TrendingUp className="text-orange-500" />,
      trend: 2.8,
      trendUp: false
    }
  ];

  // Quick actions data
  const quickActions = [
    {
      title: "New Sale",
      icon: <ShoppingBag size={24} />,
      color: "bg-primary-100 text-primary-700",
      onClick: () => navigate('/sales')
    },
    {
      title: "Add Product",
      icon: <Package size={24} />,
      color: "bg-green-100 text-green-700",
      onClick: () => navigate('/products/new')
    },
    {
      title: "View Reports",
      icon: <TrendingUp size={24} />,
      color: "bg-orange-100 text-orange-700",
      onClick: () => navigate('/reports')
    },
    {
      title: "Manage Users",
      icon: <Users size={24} />,
      color: "bg-purple-100 text-purple-700",
      onClick: () => navigate('/users')
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in md:ml-0">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="card p-5 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.title}</p>
                <h3 className="text-2xl font-bold mt-1 dark:text-slate-100">{card.value}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.subtitle}</p>
              </div>
              <div className="p-3 rounded-full bg-slate-100">
                {card.icon}
              </div>
            </div>
            <div className="flex items-center mt-4">
              <span className={`flex items-center text-xs font-medium ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {card.trendUp ? (
                  <ArrowUpRight size={14} className="mr-1" />
                ) : (
                  <ArrowDownRight size={14} className="mr-1" />
                )}
                {card.trend}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">vs last period</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Sales Chart */}
      <div className="card p-5">
        <h3 className="text-lg font-semibold mb-4 dark:text-slate-100">Weekly Sales Overview</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Sales']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar 
                dataKey="sales" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-slate-100">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="card p-4 text-center transition-transform hover:scale-105 hover:shadow-md"
            >
              <div className={`mx-auto w-12 h-12 rounded-full ${action.color} flex items-center justify-center mb-2`}>
                {action.icon}
              </div>
              <p className="text-sm font-medium dark:text-slate-100">{action.title}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}