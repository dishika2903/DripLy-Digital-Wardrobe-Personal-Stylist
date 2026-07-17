import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await login(data);
      if (res?.success) {
        navigate('/');
      } else {
        setServerError(res?.error?.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message || 'Failed to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-neutral-lightbg dark:bg-brand-neutral-darkbg flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 font-sans">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4"
      >
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-tr from-brand-purple-600 to-brand-pink-500 p-3 rounded-2xl text-white shadow-soft">
            <Sparkles className="h-8 w-8" />
          </div>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
          Welcome to <span className="bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 bg-clip-text text-transparent">DripLy</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Your digital closet and personal AI stylist awaits.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4"
      >
        <div className="glassmorphism py-8 px-6 sm:px-10 rounded-3xl shadow-soft-lg border border-slate-200/50 dark:border-slate-800/50">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-sm flex items-start gap-2"
              >
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450 dark:text-slate-550">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@domain.com"
                  {...register('email')}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border ${
                    errors.email ? 'border-rose-400 dark:border-rose-800' : 'border-slate-200 dark:border-slate-800/80'
                  } focus:border-brand-purple-500 focus:ring-1 focus:ring-brand-purple-500 rounded-2xl outline-none transition-all text-slate-800 dark:text-slate-200 text-sm`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-semibold">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-brand-purple-600 hover:text-brand-purple-500 dark:text-brand-purple-400"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-455 dark:text-slate-555">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/30 border ${
                    errors.password ? 'border-rose-400 dark:border-rose-800' : 'border-slate-200 dark:border-slate-800/80'
                  } focus:border-brand-purple-500 focus:ring-1 focus:ring-brand-purple-500 rounded-2xl outline-none transition-all text-slate-800 dark:text-slate-200 text-sm`}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-semibold">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-brand-purple-600 to-brand-pink-500 hover:from-brand-purple-700 hover:to-brand-pink-600 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md shadow-brand-purple-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-505 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-bold text-brand-purple-600 hover:text-brand-purple-500 dark:text-brand-purple-400"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
