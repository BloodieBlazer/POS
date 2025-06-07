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
  LogOut 
} from 'lucide-react';

function Sidebar() {
  const { sidebarOpen } = useApp();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={20} /> },
    { name: 'Sales', path: '/sales', icon: <ShoppingCart size={20} /> },
    { name: 'Products', path: '/products', icon: <Package size={20} /> },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

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
      
      {/* Navigation */}
      <nav className="mt-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
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
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <ul className="space-y-1">
          <li>
            <NavLink
              to="/users"
              className={({ isActive }) => `
                flex items-center px-3 py-2 rounded-md transition-colors duration-200
                ${isActive ? 'bg-primary-700 text-white' : 'text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}
              `}
            >
              <span className="mr-3"><Users size={20} /></span>
              <span className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} dark:text-slate-100`}>
                Users
              </span>
            </NavLink>
          </li>
          <li>
            <button className="
              w-full flex items-center px-3 py-2 rounded-md 
              text-slate-800 dark:text-slate-300 
              hover:bg-slate-100 dark:hover:bg-slate-700 
              hover:text-slate-900 dark:hover:text-white 
              transition-colors duration-200
            ">
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