import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: 'Login erfolgreich!',
          description: 'Sie werden zum Dashboard weitergeleitet.',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      setMessage(`Fehler: ${error.message || 'Ungültige Anmeldedaten.'}`);
      toast({
        title: 'Login fehlgeschlagen',
        description: error.message || 'Bitte überprüfen Sie Ihre Eingaben.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4'
    >
      <div className='w-full max-w-md card-glass p-8 md:p-10'>
        <div className='text-center mb-8'>
          <LogIn className='mx-auto h-12 w-12 text-purple-400 mb-4' />
          <h1 className='text-3xl font-bold text-gradient-purple-pink'>
            Anmelden bei TaskCraft AI
          </h1>
          <p className='text-slate-400 mt-2'>
            Geben Sie Ihre Daten ein, um fortzufahren.
          </p>
        </div>
        <form onSubmit={handleLogin} className='space-y-6'>
          <div>
            <Label htmlFor='email' className='text-slate-300'>
              E-Mail
            </Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='ihre@email.com'
              required
              className='mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500'
            />
          </div>
          <div>
            <Label htmlFor='password' className='text-slate-300'>
              Passwort
            </Label>
            <Input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='********'
              required
              className='mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500'
            />
          </div>
          <Button
            type='submit'
            className='w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 transition-all duration-300 ease-in-out transform hover:scale-105'
            disabled={loading}
          >
            {loading ? 'Wird geladen...' : 'Anmelden'}
          </Button>
        </form>
        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              message.startsWith('Fehler:') ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {message}
          </p>
        )}
        <p className='mt-6 text-center text-sm text-slate-400'>
          Noch kein Konto?{' '}
          <a href='#' className='font-medium text-purple-400 hover:underline'>
            Registrieren
          </a>{' '}
          (Funktion folgt)
        </p>
      </div>
    </motion.div>
  );
};

export default Login;