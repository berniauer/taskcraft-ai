import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, LogOut } from 'lucide-react';

const DashboardPage = () => {
  const { user, userId } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="card-glass p-8 md:p-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gradient-purple-pink mb-2">
            Willkommen im Dashboard!
          </h1>
          {user && (
            <p className="text-slate-300">
              Angemeldet als: {user.email} (ID: {userId})
            </p>
          )}
        </div>
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700"
        >
          <LogOut className="mr-2 h-4 w-4" /> Abmelden
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-slate-700/50 p-6 rounded-lg shadow-xl"
        >
          <LayoutDashboard className="h-8 w-8 text-purple-400 mb-3" />
          <h2 className="text-xl font-semibold mb-2 text-purple-300">
            Meine Projekte
          </h2>
          <p className="text-slate-400 text-sm">
            Übersicht über Ihre aktuellen Projekte und deren Fortschritt.
          </p>
          <Button variant="outline" className="mt-4 border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white">
            Projekte anzeigen
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-slate-700/50 p-6 rounded-lg shadow-xl"
        >
          <LayoutDashboard className="h-8 w-8 text-pink-400 mb-3" />
          <h2 className="text-xl font-semibold mb-2 text-pink-300">
            Aufgabenübersicht
          </h2>
          <p className="text-slate-400 text-sm">
            Alle Ihre anstehenden Aufgaben auf einen Blick.
          </p>
          <Button variant="outline" className="mt-4 border-pink-500 text-pink-300 hover:bg-pink-500 hover:text-white">
            Aufgaben anzeigen
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-slate-700/50 p-6 rounded-lg shadow-xl"
        >
          <LayoutDashboard className="h-8 w-8 text-sky-400 mb-3" />
          <h2 className="text-xl font-semibold mb-2 text-sky-300">
            Team-Kollaboration
          </h2>
          <p className="text-slate-400 text-sm">
            Verwalten Sie Ihr Team und arbeiten Sie gemeinsam an Zielen.
          </p>
          <Button variant="outline" className="mt-4 border-sky-500 text-sky-300 hover:bg-sky-500 hover:text-white">
            Team verwalten
          </Button>
        </motion.div>
      </div>
       <div className="mt-10 text-center">
            <img 
              className="inline-block rounded-lg shadow-2xl max-w-full h-auto md:max-w-lg" 
              alt="Futuristisches Dashboard-Interface mit Diagrammen und Grafiken" src="https://images.unsplash.com/photo-1516383274235-5f42d6c6426d" />
        </div>
    </motion.div>
  );
};

export default DashboardPage;