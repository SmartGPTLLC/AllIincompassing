import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Shield } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { showError, showSuccess } from '../lib/toast';
import { verifyConnection } from '../lib/supabase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [therapistId, setTherapistId] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionVerified, setConnectionVerified] = useState(false);
  const [connectionChecking, setConnectionChecking] = useState(true);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  // Fetch therapists for dropdown
  const { data: therapists = [], isLoading: therapistsLoading } = useQuery({
    queryKey: ['therapists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('therapists')
        .select('id, full_name, title')
        .eq('status', 'active')
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    // Verify Supabase connection
    const checkConnection = async () => {
      try {
        setConnectionChecking(true);
        await verifyConnection();
        setConnectionVerified(true);
      } catch (err) {
        console.error('Connection error:', err);
        setError('Unable to connect to the server. Please try again later.');
      } finally {
        setConnectionChecking(false);
      }
    };

    checkConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (connectionChecking) {
      setError('Still checking connection to the server. Please wait.');
      return;
    }

    if (!connectionVerified) {
      setError('Please wait for server connection to be established');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate therapist selection unless admin
    if (!isAdmin && !therapistId) {
      setError('Please select a therapist');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signUp(email, password, isAdmin, therapistId);
      showSuccess('Account created successfully! Please check your email to confirm your account.');
      navigate('/login', { 
        state: { message: 'Please check your email to confirm your account' }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
      showError(message);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Calendar className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Or{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            sign in to your account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-dark-lighter py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                 type="text"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center text-gray-900 dark:text-gray-100">
              <input
                id="is-admin"
                name="is-admin"
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="is-admin" className="ml-2 block text-sm text-gray-900 dark:text-gray-100 flex items-center">
                <Shield className="w-4 h-4 mr-1 text-blue-600 dark:text-blue-400" />
                Register as Administrator
              </label>
            </div>

            {!isAdmin && (
              <div>
                <label htmlFor="therapist" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Your Therapist
                </label>
                <div className="mt-1">
                  <select
                    id="therapist"
                    name="therapist"
                    required
                    value={therapistId}
                    onChange={(e) => setTherapistId(e.target.value)}
                    disabled={therapistsLoading}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark dark:text-white sm:text-sm"
                  >
                    <option value="">Select your therapist</option>
                    {therapists.map(therapist => (
                      <option key={therapist.id} value={therapist.id}>
                        {therapist.full_name} {therapist.title ? `(${therapist.title})` : ''}
                      </option>
                    ))}
                  </select>
                  {therapistsLoading && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Loading therapists...
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !connectionVerified}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}