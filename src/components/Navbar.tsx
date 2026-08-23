"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Truck,
  Package,
  Calculator,
  ShieldCheck,
  UserCheck,
  LogOut,
  LogIn,
  Menu,
  X,
  Compass,
  Layers,
  Users,
  Sun,
  Moon,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur text-white shadow-md border-b border-slate-800 transition-colors">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition transform">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-300 transition">
                Last-Mile <span className="text-indigo-400">Tracker</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Dispatch & Routing Engine
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === "/" ? "bg-slate-800 text-indigo-400" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Home & Track
            </Link>

            {user?.role === "CUSTOMER" && (
              <>
                <Link
                  href="/customer"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive("/customer") && pathname !== "/customer/create-order"
                      ? "bg-slate-800 text-indigo-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  My Deliveries
                </Link>
                <Link
                  href="/customer/create-order"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive("/customer/create-order")
                      ? "bg-slate-800 text-indigo-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  + Create Order
                </Link>
              </>
            )}

            {user?.role === "AGENT" && (
              <Link
                href="/agent"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive("/agent") ? "bg-slate-800 text-indigo-400" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Agent Workdeck
              </Link>
            )}

            {user?.role === "ADMIN" && (
              <>
                <Link
                  href="/admin/orders"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive("/admin/orders") ? "bg-slate-800 text-indigo-400" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  All Orders
                </Link>
                <Link
                  href="/admin/rate-cards"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive("/admin/rate-cards") ? "bg-slate-800 text-indigo-400" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Rate Cards
                </Link>
                <Link
                  href="/admin/zones"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive("/admin/zones") ? "bg-slate-800 text-indigo-400" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Zones & Pincodes
                </Link>
                <Link
                  href="/admin/agents"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive("/admin/agents") ? "bg-slate-800 text-indigo-400" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Fleet Monitor
                </Link>
              </>
            )}
          </nav>

          {/* Right Action / Auth profile & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            {/* Sun / Moon Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition border border-slate-700 focus:outline-none flex items-center justify-center"
              aria-label="Toggle Dark Mode"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-300 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-white leading-none">{user.name}</div>
                  <div className="text-[11px] text-indigo-400 font-medium capitalize flex items-center justify-end gap-1 mt-0.5">
                    {user.role === "ADMIN" && <ShieldCheck className="w-3 h-3 text-indigo-400" />}
                    {user.role === "AGENT" && <Truck className="w-3 h-3 text-amber-400" />}
                    {user.role === "CUSTOMER" && <Package className="w-3 h-3 text-blue-400" />}
                    {user.role.toLowerCase()}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition border border-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions: Theme toggle & Menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700"
              aria-label="Toggle Dark Mode"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-300" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800"
          >
            Home & Track
          </Link>
          {user?.role === "CUSTOMER" && (
            <>
              <Link
                href="/customer"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                My Deliveries
              </Link>
              <Link
                href="/customer/create-order"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                + Create Order
              </Link>
            </>
          )}
          {user?.role === "AGENT" && (
            <Link
              href="/agent"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800"
            >
              Agent Workdeck
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <>
              <Link
                href="/admin/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                All Orders
              </Link>
              <Link
                href="/admin/rate-cards"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                Rate Cards
              </Link>
              <Link
                href="/admin/zones"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                Zones & Pincodes
              </Link>
              <Link
                href="/admin/agents"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                Fleet Monitor
              </Link>
            </>
          )}
          {user ? (
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-medium text-white">{user.name}</div>
                <div className="text-xs text-indigo-400">{user.email}</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 text-xs rounded bg-rose-900/50 text-rose-300"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
