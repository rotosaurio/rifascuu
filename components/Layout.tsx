import { ReactNode, useState, useEffect, memo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
  isCompanyOwner?: boolean;
}

// Memoize the Layout component to prevent unnecessary re-renders
const Layout = memo(function Layout({ children, isAdmin = false, isCompanyOwner = false }: LayoutProps) {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Determine user roles - memoize these values to prevent re-renders
  const userIsAdmin = isAdmin && session?.user?.role === 'admin';
  const userIsCompanyOwner = isCompanyOwner && session?.user?.role === 'company_owner';
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (menuOpen && !target.closest('[data-menu-container]')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);

  // Handle loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white rounded-full animate-spin border-t-transparent"></div>
          <div className="mt-4 text-white text-center font-medium">Cargando...</div>
        </div>
      </div>
    );
  }

  const toggleMenu = () => setMenuOpen(prev => !prev);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600" id="layout-root">
      {/* Hamburger menu button */}
      <div className="fixed top-4 right-4 z-50" data-menu-container>
        <button 
          onClick={toggleMenu} 
          className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all"
          aria-label="Menu"
        >
          <div className="w-6 h-0.5 bg-white mb-1.5 transition-all" style={{ 
            transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' 
          }}></div>
          <div className="w-6 h-0.5 bg-white mb-1.5 transition-all" style={{ 
            opacity: menuOpen ? 0 : 1 
          }}></div>
          <div className="w-6 h-0.5 bg-white transition-all" style={{ 
            transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' 
          }}></div>
        </button>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            data-menu-container
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 right-4 bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-2xl z-40 min-w-[200px]"
          >
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                Inicio
              </Link>
              <Link href="/rifas" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                Rifas
              </Link>
              <Link href="/empresas" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                Empresas
              </Link>
              <Link href="/ganadores" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                Ganadores
              </Link>
              
              <div className="border-t border-white/20 my-2"></div>
              
              {session ? (
                <>
                  <div className="p-3 border-b border-white/20">
                    <p className="text-sm text-white/70">Conectado como</p>
                    <p className="text-white font-medium">{session.user?.email}</p>
                  </div>
                  <Link href="/dashboard" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                    Mi Dashboard
                  </Link>
                  <Link href="/my-raffles" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                    Mis Rifas
                  </Link>
                  <Link href="/raffles/create" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                    Crear Rifa
                  </Link>
                  <Link href="/perfil" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                    Mi Perfil
                  </Link>
                  
                  {/* Admin or company owner specific links */}
                  {userIsAdmin && (
                    <Link href="/admin" className="text-yellow-300 hover:bg-yellow-300/10 px-4 py-2 rounded-lg transition-all">
                      Panel Admin
                    </Link>
                  )}
                  
                  {userIsCompanyOwner && (
                    <Link href="/empresa" className="text-yellow-300 hover:bg-yellow-300/10 px-4 py-2 rounded-lg transition-all">
                      Panel Empresa
                    </Link>
                  )}
                  
                  <button 
                    onClick={() => signOut()} 
                    className="text-red-400 hover:bg-red-400/10 px-4 py-2 rounded-lg transition-all text-left mt-2"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                    Iniciar Sesión
                  </Link>
                  <Link href="/auth/signup" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Admin panel tabs - make fully transparent */}
      {(userIsAdmin || userIsCompanyOwner) && (
        <div className="fixed top-16 w-full z-40 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center overflow-x-auto">
              <span className="font-bold whitespace-nowrap">
                {userIsAdmin ? 'Panel Admin' : 'Panel Empresa'}
              </span>
              <nav className="ml-6">
                <ul className="flex space-x-6">
                  {userIsAdmin ? (
                    <>
                      <li className="whitespace-nowrap"><Link href="/admin" className="hover:text-yellow-300 transition-all">Dashboard</Link></li>
                      <li className="whitespace-nowrap"><Link href="/admin/users" className="hover:text-yellow-300 transition-all">Usuarios</Link></li>
                      <li className="whitespace-nowrap"><Link href="/admin/companies" className="hover:text-yellow-300 transition-all">Empresas</Link></li>
                      <li className="whitespace-nowrap"><Link href="/admin/raffles" className="hover:text-yellow-300 transition-all">Rifas</Link></li>
                      <li className="whitespace-nowrap"><Link href="/admin/settings" className="hover:text-yellow-300 transition-all">Configuración</Link></li>
                    </>
                  ) : (
                    <>
                      <li className="whitespace-nowrap"><Link href="/empresa" className="hover:text-yellow-300 transition-all">Dashboard</Link></li>
                      <li className="whitespace-nowrap"><Link href="/empresa/rifas" className="hover:text-yellow-300 transition-all">Mis Rifas</Link></li>
                      <li className="whitespace-nowrap"><Link href="/empresa/rifas/crear" className="hover:text-yellow-300 transition-all">Crear Rifa</Link></li>
                      <li className="whitespace-nowrap"><Link href="/empresa/perfil" className="hover:text-yellow-300 transition-all">Perfil de Empresa</Link></li>
                    </>
                  )}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-grow">
        {isAdmin && !userIsAdmin && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 mb-6">
            <div className="bg-red-600/20 backdrop-blur-md text-white p-4 rounded-xl shadow-sm" role="alert">
              <p>No tienes permisos de administrador para acceder a esta sección.</p>
            </div>
          </div>
        )}
        
        {isCompanyOwner && !userIsCompanyOwner && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 mb-6">
            <div className="bg-red-600/20 backdrop-blur-md text-white p-4 rounded-xl shadow-sm" role="alert">
              <p>No tienes permisos de empresa para acceder a esta sección.</p>
            </div>
          </div>
        )}
        
        <motion.div 
          key="main-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="transition-all duration-300 ease-in-out"
        >
          {children}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
});

export default Layout;
