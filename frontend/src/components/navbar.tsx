import type { ReactNode } from 'react';
import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const NavbarRoot = ({ children }: { children: ReactNode }) => {
  return (
    <nav className="sticky top-0 z-50 bg-blue-500 border-b border-blue-600 shadow-md">
      <div className="px-6 md:px-8 h-20 flex items-center justify-between">
        {children}
      </div>
    </nav>
  );
};

const Brand = ({ children }: { children: ReactNode }) => (
  <NavLink to="/" className="text-xl font-bold text-slate-100 tracking-wide">
    {children}
  </NavLink>
);

const DesktopContent = ({ children }: { children: ReactNode }) => (
  <div className="hidden md:flex items-center gap-10">{children}</div>
);

const MobileMenu = ({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: ReactNode;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-20 left-0 right-0 bg-blue-600 border-b border-blue-400 p-6 flex flex-col gap-6 md:hidden z-40 shadow-xl"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

const Item = ({
  to,
  children,
  onClick,
}: {
  to: string;
  children: ReactNode;
  onClick?: () => void;
}) => {
  return (
    <NavLink to={to} className="relative p-1" onClick={onClick}>
      {({ isActive }) => (
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={`relative text-sm font-medium tracking-wide transition-colors duration-300 ${isActive ? "text-white" : "text-slate-100 hover:text-white"
            }`}
        >
          {children}

          {/* Animated underline */}
          {isActive && (
            <motion.span
              layoutId="navbar-underline"
              className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </motion.div>
      )}
    </NavLink>
  );
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NavbarRoot>
      <Brand>Vizibble</Brand>

      <DesktopContent>
        <Item to="/">Dashboard</Item>
        <Item to="/alerts">Alerts</Item>
      </DesktopContent>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <MobileMenu isOpen={isOpen}>
        <Item to="/" onClick={() => setIsOpen(false)}>
          Dashboard
        </Item>
        <Item to="/alerts" onClick={() => setIsOpen(false)}>
          Alerts
        </Item>
      </MobileMenu>
    </NavbarRoot>
  );
}
