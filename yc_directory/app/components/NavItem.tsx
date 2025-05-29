'use client';

import Link from 'next/link';

interface NavItemProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'link' | 'button';
}

const NavItem = ({ href, onClick, children, type = 'link' }: NavItemProps) => {
  if (type === 'button') {
    return (
      <button 
        onClick={onClick}
        className="nav-item"
      >
        {children}
      </button>
    );
  }

  return (
    <Link 
      href={href || '#'}
      className="nav-item"
    >
      {children}
    </Link>
  );
};

export default NavItem; 