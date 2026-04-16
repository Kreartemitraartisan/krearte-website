"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-krearte-black text-krearte-white py-16">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-sans text-2xl font-light mb-4">KREARTE</h3>
            <p className="text-krearte-gray-400 font-light leading-relaxed mb-6">
              Luxury wallcoverings and accessories.
              <br />
              Handcrafted with passion, designed for elegant spaces.
            </p>
            
            {/* Social Media Links - External (pakai <a>) */}
            <div className="flex gap-6">
              <a
                href="https://www.instagram.com/kreartemitraartisan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                Instagram
              </a>
              <a
                href="https://id.pinterest.com/KrearteMitraArtisan/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                Pinterest
              </a>
              <a
                href="https://www.tiktok.com/@kreartewall"
                target="_blank"
                rel="noopener noreferrer"
                className="text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                Tiktok
              </a>
            </div>
          </div>

          {/* Shop Links - Internal (pakai <Link>) */}
          <div>
            <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-krearte-white">Shop</h4>
            <nav className="space-y-3">
              <Link
                href="/collection/wallcovering"
                className="block text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                Wallcovering
              </Link>
              <Link
                href="/collections/designers"
                className="block text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                Designer Collections
              </Link>
              <Link
                href="/materials"
                className="block text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                Materials
              </Link>
              <Link
                href="/custom"
                className="block text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                Custom with Us
              </Link>
            </nav>
          </div>

          {/* Info Links - Internal (pakai <Link>) */}
          <div>
            <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-krearte-white">Info</h4>
            <nav className="space-y-3">
              <Link
                href="/about"
                className="block text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="block text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                Contact
              </Link>
              <Link
                href="/shipping"
                className="block text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                Shipping
              </Link>
              <Link
                href="/faq"
                className="block text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                FAQ
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-krearte-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-krearte-gray-400 text-sm font-light">
              © {new Date().getFullYear()} Krearte. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-krearte-gray-400 hover:text-krearte-white transition-colors text-sm font-light"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}