
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { NAV_LINKS, APP_TITLE } from '../constants';
import { NavItemType } from '../types';
import { LogoIcon, ChevronDownIcon, BellIcon, QuestionMarkCircleIcon } from './icons';
import Button from './Button';

const Navbar: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and App Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-gray-700 hover:text-blue-600">
              <LogoIcon className="h-7 w-7 text-blue-600" />
              <span className="ml-3 font-semibold text-lg">{APP_TITLE}</span>
              <ChevronDownIcon className="ml-1 h-4 w-4 text-gray-500" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-3">
            {NAV_LINKS.map((item: NavItemType) => (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
             {/* Adding explicit links for other pages for dev/demo, would be integrated differently in prod */}
            <NavLink to="/create-program" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>プログラム作成</NavLink>
            <NavLink to="/generate-abstracts" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>抄録集生成</NavLink>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <BellIcon className="h-6 w-6" />
            </button>
            <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <QuestionMarkCircleIcon className="h-6 w-6" />
            </button>
            <Button variant="primary" size="sm">
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
