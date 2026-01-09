
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { NAV_LINKS, APP_TITLE } from '../constants';
import { NavItemType } from '../types';
import { LogoIcon } from './icons';

const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8 h-16">
          {/* Logo and App Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                <LogoIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="ml-3 font-bold text-lg text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                {APP_TITLE}
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {NAV_LINKS.map((item: NavItemType) => (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>


        </div>
      </div>
    </header>
  );
};

export default Navbar;
