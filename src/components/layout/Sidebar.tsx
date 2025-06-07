import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  CreditCard,
  Users,
  LogOut,
  Clock,
  Warehouse
} from 'lucide-react';

function Sidebar() {
  const { sidebarOpen } = useApp();
  const { user, logout, hasPermission } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={20} />, permission: null },
    { name: 'Sales', path: '/sales', icon: <ShoppingCart size={20} />, permission: 'sales.create' },
    { name: 'Products', path: '/products', icon: <Package size={20} />, permission: 'products.view' },
    { name: 'Customers', path: '/customers', icon: <Users size={20} />, permission: 'customers.view' },
    { name: 'Inventory', path: '/inventory', icon: <Warehouse size={20} />, permission: 'inventory.view' },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, permission: 'reports.view' },
    { name: 'Shifts', path: '/shifts', icon: <Clock size={20} />, permission: 'shifts.own' },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-20 bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-white border-r border-gray-200 dark:border-slate-700
      ${sidebarOpen ? 'w-64' : 'w-20 md:w-16'}
      transform transition-all duration-300 ease-in-out
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <div className={`h-8 rounded bg-primary-500 flex items-center justify-center ${sidebarOpen ? 'w-8' : 'w-10 mx-auto'}`}>
            <CreditCard size={18} className="text-white" />
          </div>
          <span className={`font-bold text-lg transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} text-slate-800 dark:text-slate-100`}>
            RetailPOS
          </span>
        </div>
      </div>
      
      {/* User Info */}
      {sidebarOpen && user && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-primary-700 dark:text-primary-300 font-medium">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="mt-4 px-2 flex-1">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center px-3 py-2 rounded-md transition-colors duration-200
                  ${isActive ? 'bg-primary-700 text-white' : 'text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}
                `}
              >
                <span className="mr-3">{item.icon}</span>
                <span className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} dark:text-slate-100`}>
                  {item.name}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Bottom Section */}
      <div className="p-4">
        <ul className="space-y-1">
          {hasPermission('*') && (
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) => `
                  flex items-center px-3 py-2 rounded-md transition-colors duration-200
                  ${isActive ? 'bg-primary-700 text-white' : 'text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}
                `}
              >
                <span className="mr-3"><Settings size={20} /></span>
                <span className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} dark:text-slate-100`}>
                  Settings
                </span>
              </NavLink>
            </li>
          )}
          <li>
            <button 
              onClick={logout}
              className="
                w-full flex items-center px-3 py-2 rounded-md 
                text-slate-800 dark:text-slate-300 
                hover:bg-slate-100 dark:hover:bg-slate-700 
                hover:text-slate-900 dark:hover:text-white 
                transition-colors duration-200
              "
            >
              <span className="mr-3"><LogOut size={20} /></span>
              <span className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} dark:text-slate-100`}>
                Logout
              </span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;