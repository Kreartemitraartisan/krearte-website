"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, User, LogOut, Heart, Settings, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cart/context";
import { useWishlist } from "@/lib/wishlist/context";

// Hardcoded categories untuk Wallcovering dropdown
const WALLCOVERING_CATEGORIES = [
  { name: "Flower & Leaves", slug: "flower-leaves" },
  { name: "Animals", slug: "animals" },
  { name: "Chinoiserie", slug: "chinoiserie" },
  { name: "Lotus", slug: "lotus" },
  { name: "Jolly Wolly", slug: "jolly-wolly" },
  { name: "Marble", slug: "marble" },
  { name: "Abstract", slug: "abstract" },
  { name: "Geometric", slug: "geometric" },
  { name: "Scenery", slug: "scenery" },
  { name: "Toile de Jouy", slug: "toile-de-jouy" },
  { name: "Tropical", slug: "tropical" },
  { name: "Zen", slug: "zen" },
  { name: "Du Pavillon", slug: "du-pavillon" },
];

const navItems = [
  { label: "Designer Collections", href: "/collection/designer" },
  { label: "Materials", href: "/materials" },
  { label: "Gallery", href: "/gallery" },
  { label: "Custom with Us", href: "/custom" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [wallcoveringDropdownOpen, setWallcoveringDropdownOpen] = useState(false);
  
  const { itemCount, openCart } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { data: session, status } = useSession();
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const wallcoveringDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        wallcoveringDropdownRef.current && 
        !wallcoveringDropdownRef.current.contains(event.target as Node)
      ) {
        setWallcoveringDropdownOpen(false);
      }
    };

    if (userMenuOpen || wallcoveringDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen, wallcoveringDropdownOpen]);

  // ✅ Check admin
  const isAdmin = session?.user?.role === "admin";

  // ✅ Debug log
  useEffect(() => {
    console.log('📦 [HEADER] Current session:', {
      hasSession: !!session,
      user: session?.user,
      role: session?.user?.role,
      isAdmin
    });
  }, [session, isAdmin]);

  // Show loading atau skeleton
  if (status === "loading") {
    return (
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-krearte-cream/90 backdrop-blur-md border-b border-krearte-gray-100"
      >
        <nav className="container mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="h-8 md:h-10 w-32 bg-krearte-gray-200 animate-pulse rounded" />
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-krearte-gray-200 animate-pulse rounded-full" />
              <div className="w-8 h-8 bg-krearte-gray-200 animate-pulse rounded-full" />
              <div className="w-8 h-8 bg-krearte-gray-200 animate-pulse rounded-full" />
            </div>
          </div>
        </nav>
      </motion.header>
    );
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-krearte-cream/90 backdrop-blur-md border-b border-krearte-gray-100"
      >
        <nav className="container mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 z-50">
              <div className="h-8 md:h-10 flex items-center">
                <img
                  src="/images/logo-krearte.png"
                  alt="Krearte Logo"
                  className="h-full w-auto object-contain"
                  width={120}
                  height={40}
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              
              {/* Wallcovering Dropdown */}
              <div 
                className="relative"
                ref={wallcoveringDropdownRef}
                onMouseEnter={() => setWallcoveringDropdownOpen(true)}
                onMouseLeave={() => setWallcoveringDropdownOpen(false)}
              >
                <button
                  className="flex items-center gap-1 text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors relative group py-2"
                >
                  Wallcovering
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${wallcoveringDropdownOpen ? 'rotate-180' : ''}`} />
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-krearte-black transition-all duration-300 group-hover:w-full" />
                </button>

                {/* Dropdown Popup */}
                <AnimatePresence>
                  {wallcoveringDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-80 bg-krearte-white border border-krearte-gray-200 rounded-lg shadow-elevated p-4 z-50"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {WALLCOVERING_CATEGORIES.map((cat) => (
                          <Link
                            key={cat.slug}
                            href={`/collection/wallcovering/${cat.slug}`}
                            className="group p-2 hover:bg-krearte-gray-50 rounded transition-colors"
                            onClick={() => setWallcoveringDropdownOpen(false)}
                          >
                            <p className="text-sm font-light text-krearte-black group-hover:text-krearte-gray-600">
                              {cat.name}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Other Nav Items */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-krearte-black transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {/* User Menu (Desktop) */}
              {session?.user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-2 hover:bg-krearte-gray-100 rounded-full transition-colors"
                    aria-label="User menu"
                  >
                    <User className="w-5 h-5 text-krearte-black" />
                    <span className="text-sm font-light hidden md:block">
                      {session.user.name}
                    </span>
                  </button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-krearte-white border border-krearte-gray-200 rounded-lg shadow-elevated py-2 z-50"
                      >
                        {/* Admin Link */}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm font-light text-krearte-black hover:bg-krearte-gray-100 transition-colors flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        
                        <Link
                          href="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm font-light text-krearte-black hover:bg-krearte-gray-100 transition-colors"
                        >
                          My Account
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm font-light text-krearte-black hover:bg-krearte-gray-100 transition-colors"
                        >
                          Order History
                        </Link>
                        <hr className="my-2 border-krearte-gray-100" />
                        <button
                          onClick={() => {
                            signOut({ callbackUrl: "/" });
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-light text-red-600 hover:bg-krearte-gray-100 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-light text-krearte-black hover:bg-krearte-gray-100 rounded-full transition-colors"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Link>
              )}

              {/* Wishlist Icon */}
              <Link
                href="/account/wishlist"
                className="relative p-2 hover:bg-krearte-gray-100 rounded-full transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5 text-krearte-black" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-krearte-black text-krearte-white text-xs rounded-full flex items-center justify-center font-light">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <button
                onClick={openCart}
                className="relative p-2 hover:bg-krearte-gray-100 rounded-full transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-krearte-black" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-krearte-black text-krearte-white text-xs rounded-full flex items-center justify-center font-light">
                    {itemCount}
                  </span>
                )}
              </button>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-krearte-gray-100 rounded-full transition-colors"
              >
                <Menu className="w-5 h-5 text-krearte-black" />
              </button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-krearte-cream md:hidden"
          >
            <div className="flex flex-col h-full p-6">
              {/* Mobile Header */}
              <div className="flex justify-between items-center mb-12">
                {/* Mobile Logo */}
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="h-8">
                  <img
                    src="/images/logo-krearte.png"
                    alt="Krearte Logo"
                    className="h-full w-auto object-contain"
                    width={100}
                    height={32}
                  />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-krearte-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Nav Items */}
              <div className="flex flex-col space-y-6 flex-1">
                
                {/* Wallcovering Accordion (Mobile) */}
                <MobileAccordion 
                  title="Wallcovering Collection"
                  categories={WALLCOVERING_CATEGORIES}
                  basePath="/collection/wallcovering"
                  onClose={() => setMobileMenuOpen(false)}
                />
                
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-2xl font-light text-krearte-black hover:text-krearte-gray-600 transition-colors block py-2"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Mobile Auth */}
              <div className="pt-6 border-t border-krearte-gray-100 space-y-4">
                {session?.user ? (
                  <>
                    <div className="flex items-center gap-2 text-krearte-black font-light">
                      <User className="w-5 h-5" />
                      {session.user.name}
                    </div>
                    
                    {/* Admin Link - Mobile */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-krearte-black font-light"
                      >
                        <Settings className="w-5 h-5" />
                        Admin Panel
                      </Link>
                    )}
                    
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-krearte-black font-light"
                    >
                      My Account
                    </Link>
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: "/" });
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-red-600 font-light"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-krearte-black font-light"
                  >
                    <User className="w-5 h-5" />
                    Sign In
                  </Link>
                )}
                
                {/* Mobile Cart */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCart();
                  }}
                  className="flex items-center text-krearte-black font-light"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Cart ({itemCount})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ✅ Helper Component: Mobile Accordion for Categories
function MobileAccordion({ 
  title, 
  categories, 
  basePath, 
  onClose 
}: { 
  title: string;
  categories: { name: string; slug: string }[];
  basePath: string;
  onClose: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-2xl font-light text-krearte-black py-2"
      >
        {title}
        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pl-4 space-y-1"
          >
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`${basePath}/${cat.slug}`}
                onClick={onClose}
                className="block text-lg font-light text-krearte-gray-600 hover:text-krearte-black py-1 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}