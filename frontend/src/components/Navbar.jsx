import React, { useState, useEffect, useRef } from "react";
import { navbarStyles, navbarCSS } from "../assets/dummyStyles";
import {
  Calendar,
  Clapperboard,
  Film,
  Home,
  LogOut,
  User,
  Menu,
  Mail,
  Ticket,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auth state
  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);

    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  // Resize + Escape
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    const onKey = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "movies", label: "Movies", icon: Film, path: "/movies" },
    { id: "releases", label: "Releases", icon: Calendar, path: "/releases" },
    { id: "contact", label: "Contact", icon: Mail, path: "/contact" },
    { id: "bookings", label: "Bookings", icon: Ticket, path: "/bookings" },
  ];

  return (
    <nav
      className={`${navbarStyles.nav.base} ${
        isScrolled ? navbarStyles.nav.scrolled : navbarStyles.nav.notScrolled
      }`}
    >
      <div className={`${navbarStyles.container} relative`}>
        {/* Logo */}
        <div className={navbarStyles.logoContainer}>
          <div className={navbarStyles.logoIconContainer}>
            <Clapperboard className={navbarStyles.logoIcon} />
          </div>
          <div className={navbarStyles.logoText}>ShowTime</div>
        </div>

        {/* Centered Desktop Nav */}
        <div className={navbarStyles.desktopNav}>
          <div className={navbarStyles.desktopNavItems}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className={navbarStyles.desktopNavItem}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `${navbarStyles.desktopNavLink.base} ${
                        isActive
                          ? navbarStyles.desktopNavLink.active
                          : navbarStyles.desktopNavLink.inactive
                      }`
                    }
                  >
                    <Icon className={navbarStyles.desktopNavIcon} />
                    <span>{item.label}</span>
                  </NavLink>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Auth */}
        <div className="hidden lg:flex items-center gap-2 z-20">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className={navbarStyles.logoutButton}
            >
              <LogOut className={navbarStyles.authIcon} />
              <span>Logout</span>
            </button>
          ) : (
            <NavLink to="/login" className={navbarStyles.loginButton}>
              <User className={navbarStyles.authIcon} />
              <span>Login</span>
            </NavLink>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className={navbarStyles.mobileMenuToggle}>
          <button
            onClick={() => setIsMenuOpen((s) => !s)}
            className={navbarStyles.mobileMenuButton}
          >
            {isMenuOpen ? (
              <X className={navbarStyles.mobileMenuIcon} />
            ) : (
              <Menu className={navbarStyles.mobileMenuIcon} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div ref={menuRef} className={navbarStyles.mobileMenuPanel}>
          <div className={navbarStyles.mobileMenuItems}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `${navbarStyles.mobileNavLink.base} ${
                      isActive
                        ? navbarStyles.mobileNavLink.active
                        : navbarStyles.mobileNavLink.inactive
                    }`
                  }
                >
                  <Icon className={navbarStyles.mobileNavIcon} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className={navbarStyles.mobileAuthSection}>
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className={navbarStyles.mobileLogoutButton}
                >
                  <LogOut className={navbarStyles.mobileAuthIcon} />
                  Logout
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className={navbarStyles.mobileLoginButton}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className={navbarStyles.mobileAuthIcon} />
                  Login
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{navbarCSS}</style>
    </nav>
  );
};

export default Navbar;
