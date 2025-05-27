import React from 'react';
import { Routes, Route, Link, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Home, Settings, User, LogOut, LayoutDashboard as LayoutDashboardIcon, Menu, X, ShieldCheck, ShieldOff, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Login from '@/components/Auth/Login';
import DashboardPage from '@/pages/DashboardPage';
import BoardViewPage from '@/pages/BoardViewPage';
import ImportPage from '@/pages/ImportPage'; // Import der neuen Seite
import BoardList from '@/components/Boards/BoardList';
import { supabase } from '@/lib/supabaseClient';
import { Label } from '@/components/ui/label'; 

const LoadingSpinner = ({ message = "Lade Anwendung..." }) => (
  <div className="flex flex-col justify-center items-center min-h-screen bg-slate-900 text-white">
    <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-xl mt-4">{message}</p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const NavLink = ({ to, icon: Icon, children, title }) => (
  <Button variant="ghost" size="sm" asChild title={title}>
    <Link to={to} className="flex items-center">
      <Icon className="mr-0 md:mr-2 h-4 w-4 flex-shrink-0" /> 
      <span className="hidden md:inline">{children}</span>
    </Link>
  </Button>
);

const AppHeader = ({ onToggleSidebar, showSidebarToggle, onLogout }) => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <nav className="bg-slate-900/80 backdrop-blur-lg shadow-lg p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          {showSidebarToggle && (
            <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="mr-2 md:hidden text-slate-300 hover:text-purple-400">
              <Menu className="h-6 w-6" />
            </Button>
          )}
          <Link to="/dashboard" className="text-2xl font-bold text-gradient-purple-pink">
            taskcraft-ai
          </Link>
        </div>
        <div className="space-x-1 md:space-x-2 flex items-center">
          <NavLink to="/dashboard" icon={LayoutDashboardIcon} title="Dashboard">Dashboard</NavLink>
          <NavLink to="/import" icon={UploadCloud} title="Import">Import</NavLink>
          <NavLink to="/profile" icon={User} title="Profil">Profil</NavLink>
          <NavLink to="/settings" icon={Settings} title="Einstellungen">Einstellungen</NavLink>
          <Button variant="ghost" size="sm" onClick={onLogout} title="Abmelden" className="flex items-center">
            <LogOut className="mr-0 md:mr-2 h-4 w-4 flex-shrink-0" /> <span className="hidden md:inline">Abmelden</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

const AppSidebar = ({ isOpen, onClose }) => (
  <>
    <aside className="hidden md:block w-64 bg-slate-800/70 backdrop-blur-md shadow-lg flex-shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-4">
        <BoardList />
      </div>
    </aside>
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="md:hidden fixed inset-y-0 left-0 w-64 bg-slate-800/95 backdrop-blur-xl shadow-2xl z-40 p-4 overflow-y-auto custom-scrollbar"
          >
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-purple-300">
              <X/>
            </Button>
            <BoardList />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  </>
);

const AppFooter = () => (
  <footer className="bg-slate-900/70 backdrop-blur-lg text-center p-4 mt-auto">
    <p className="text-sm text-slate-400">
      &copy; {new Date().getFullYear()} taskcraft-ai. Erstellt mit Hostinger Horizons.
    </p>
  </footer>
);

const MainLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: 'Abmeldefehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Erfolgreich abgemeldet' });
      navigate('/login');
    }
  };

  const showSidebar = user && !['/login', '/'].includes(location.pathname);
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 text-slate-100 flex flex-col">
      <AppHeader 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        showSidebarToggle={showSidebar}
        onLogout={handleLogout}
      />
      
      <div className={`flex-grow container mx-auto ${showSidebar ? 'flex' : ''} w-full`}>
        {showSidebar && <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
        <main className={`flex-grow ${showSidebar ? 'md:pl-6' : ''} ${isHomePage ? '' : 'p-4 md:p-6'} w-full overflow-y-auto custom-scrollbar`}>
          <Outlet />
        </main>
      </div>
      
      {(isHomePage || showSidebar) && <AppFooter />}
    </div>
  );
};

const HomePage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12 md:py-16 px-4"
    >
      <motion.h1 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-4xl md:text-6xl font-extrabold mb-6 text-gradient-purple-pink leading-tight"
      >
        Willkommen bei TaskCraft AI
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto"
      >
        Die intelligente Art, Ihre Projekte und Aufgaben zu managen – intuitiv, kollaborativ und effizient.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-10 rounded-lg shadow-xl hover:shadow-purple-500/50 transition-all duration-300 ease-in-out transform hover:scale-105 text-lg"
          asChild
        >
          <Link to="/login">Jetzt starten</Link>
        </Button>
      </motion.div>
       <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            whileHover={{ scale: 1.03, y: -5, boxShadow: "0px 10px 20px rgba(128, 90, 213, 0.3)" }}
            className="p-6 bg-slate-800/60 rounded-xl shadow-xl backdrop-blur-sm"
          >
            <ShieldCheck className="w-10 h-10 text-purple-400 mb-3" />
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">Intelligente Aufgabenplanung</h2>
            <p className="text-slate-400">Organisieren Sie Ihre Projekte mühelos mit KI-gestützten Vorschlägen und Priorisierungen für maximale Effizienz.</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            whileHover={{ scale: 1.03, y: -5, boxShadow: "0px 10px 20px rgba(217, 70, 239, 0.3)" }}
            className="p-6 bg-slate-800/60 rounded-xl shadow-xl backdrop-blur-sm"
          >
            <User className="w-10 h-10 text-pink-400 mb-3" />
            <h2 className="text-2xl font-semibold mb-3 text-pink-400">Kollaborative Workflows</h2>
            <p className="text-slate-400">Arbeiten Sie nahtlos mit Ihrem Team zusammen, teilen Sie Fortschritte in Echtzeit und erreichen Sie Ihre Ziele schneller als je zuvor.</p>
          </motion.div>
        </div>
        <motion.div 
          className="mt-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
            <img  
              className="inline-block rounded-lg shadow-2xl max-w-full h-auto md:max-w-lg border-2 border-purple-500/30" 
              alt="Abstrakte Darstellung von KI und Aufgabenmanagement mit futuristischen Elementen"
             src="https://images.unsplash.com/photo-1677442136019-21780ecad995" />
        </motion.div>
    </motion.div>
  );
};

const ProfilePage = () => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
    className="card-glass p-6 md:p-8"
  >
    <h1 className="text-3xl font-bold mb-6 text-gradient-purple-pink">Profil</h1>
    <div className="flex flex-col items-center">
      <img  
        className="w-32 h-32 rounded-full mb-4 border-4 border-purple-500 shadow-lg object-cover" 
        alt="Platzhalter für Benutzer-Avatar mit abstraktem Hintergrund"
       src="https://images.unsplash.com/photo-1589861255083-92d2efd449f1" />
      <p className="text-xl font-semibold text-slate-100">Benutzername</p>
      <p className="text-slate-400">benutzer@example.com</p>
      <Button className="mt-6 bg-pink-600 hover:bg-pink-700">Profil bearbeiten</Button>
    </div>
  </motion.div>
);

const SettingsPage = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
    className="card-glass p-6 md:p-8"
  >
    <h1 className="text-3xl font-bold mb-6 text-gradient-purple-pink">Einstellungen</h1>
    <div className="space-y-6">
      <div>
        <Label htmlFor="theme" className="block text-sm font-medium text-slate-300 mb-1">Thema</Label>
        <select id="theme" className="w-full py-2 px-3 border border-slate-600 bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white">
          <option>Dunkel</option>
          <option disabled>Hell (bald verfügbar)</option>
        </select>
      </div>
      <div>
        <Label className="block text-sm font-medium text-slate-300 mb-1">Benachrichtigungen</Label>
        <div className="mt-2 space-y-2">
           <div className="flex items-center">
             <input id="emailNotifications" name="notifications" type="checkbox" className="h-4 w-4 text-purple-600 border-slate-500 rounded focus:ring-purple-500 bg-slate-700" defaultChecked/>
             <label htmlFor="emailNotifications" className="ml-2 block text-sm text-slate-300">E-Mail-Benachrichtigungen</label>
           </div>
           <div className="flex items-center">
             <input id="pushNotifications" name="notifications" type="checkbox" className="h-4 w-4 text-purple-600 border-slate-500 rounded focus:ring-purple-500 bg-slate-700" />
             <label htmlFor="pushNotifications" className="ml-2 block text-sm text-slate-300">Push-Benachrichtigungen (App)</label>
           </div>
        </div>
      </div>
       <div>
        <Button className="bg-purple-600 hover:bg-purple-700">Einstellungen speichern</Button>
      </div>
    </div>
  </motion.div>
);

const NotFoundPage = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center py-10 md:py-20 card-glass p-6 md:p-8"
    >
        <ShieldOff className="w-24 h-24 text-red-500 mx-auto mb-6" />
        <h1 className="text-5xl md:text-7xl font-bold text-red-500 mb-4">404</h1>
        <p className="text-xl md:text-2xl text-slate-300 mb-8">Hoppla! Diese Seite wurde nicht gefunden.</p>
        <Button asChild className="bg-purple-600 hover:bg-purple-700 text-lg py-3 px-6">
            <Link to="/dashboard">Zurück zum Dashboard</Link>
        </Button>
         <div className="mt-12">
            <img  
                className="mx-auto w-48 h-auto md:w-64 opacity-70" 
                alt="Verwirrter Roboter, der eine Landkarte hält und den Weg sucht"
             src="https://images.unsplash.com/photo-1672789210128-c9ac59de248f" />
        </div>
    </motion.div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="boards/:boardId" element={<ProtectedRoute><BoardViewPage /></ProtectedRoute>} />
        <Route path="import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={ <NotFoundPage /> } />
      </Route>
    </Routes>
  );
}

export default App;
