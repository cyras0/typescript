'use client';

import Link from 'next/link';

interface NavItemProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'link' | 'button';
}

const NavItem = ({ href, onClick, children, type = 'link' }: NavItemProps) => {
  const commonClasses = "text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 hover:bg-gray-800";

  if (type === 'button') {
    return (
      <button 
        onClick={onClick}
        className={commonClasses}
      >
        {children}
      </button>
    );
  }

  return (
    <Link 
      href={href || '#'}
      className={commonClasses}
    >
      {children}
    </Link>
  );
};

export default NavItem; 