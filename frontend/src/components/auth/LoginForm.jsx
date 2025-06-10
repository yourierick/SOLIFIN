import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTheme } from '../../contexts/ThemeContext';
import Notification from '../Notification';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, IdentificationIcon } from '@heroicons/react/24/outline';

const LoginForm = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isDarkMode } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm();

  // Surveiller la valeur de rememberMe
  const rememberMe = watch('rememberMe');

  // Charger l'identifiant stocké au montage du composant
  useEffect(() => {
    const storedLogin = localStorage.getItem('rememberedLogin');
    const storedRememberMe = localStorage.getItem('rememberMe') === 'true';

    if (storedLogin && storedRememberMe) {
      setValue('login', storedLogin);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const result = await login(data.login, data.password);
      
      if (result.success) {
        // Gérer le stockage de l'identifiant
        if (data.rememberMe) {
          localStorage.setItem('rememberedLogin', data.login);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedLogin');
          localStorage.removeItem('rememberMe');
        }
        Notification.success("Bonjour " + result.user.name + " !");
      } else {
        Notification.error(result.message);
      }
    } catch (error) {
      Notification.error('Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer le changement de l'état "Se souvenir de moi"
  const handleRememberMeChange = (e) => {
    const checked = e.target.checked;
    setValue('rememberMe', checked);
    
    if (!checked) {
      localStorage.removeItem('rememberedLogin');
      localStorage.removeItem('rememberMe');
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="login" className="sr-only">
            Email ou ID de compte
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IdentificationIcon className={`h-5 w-5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </div>
            <input
              {...register('login', {
                required: 'L\'identifiant est requis'
              })}
              type="text"
              className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm pl-10 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Email ou ID de compte"
            />
          </div>
          {errors.login && (
            <p className="mt-1 text-sm text-red-600">{errors.login.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className={`h-5 w-5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </div>
            <input
              {...register('password', {
                required: 'Le mot de passe est requis',
                minLength: {
                  value: 8,
                  message: 'Le mot de passe doit contenir au moins 8 caractères',
                },
              })}
              type={showPassword ? 'text' : 'password'}
              className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm pl-10 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Mot de passe"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeSlashIcon className={`h-5 w-5 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
              ) : (
                <EyeIcon className={`h-5 w-5 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            {...register('rememberMe')}
            type="checkbox"
            onChange={handleRememberMeChange}
            className={`h-4 w-4 rounded focus:ring-primary-500 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-primary-500' 
                : 'border-gray-300 text-primary-600'
            }`}
          />
          <label htmlFor="rememberMe" className={`ml-2 block text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-900'
          }`}>
            Se souvenir de moi
          </label>
        </div>

        <div className="text-sm">
          <Link
            to="/forgot-password"
            className="font-medium text-primary-500 hover:text-primary-400"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
            isLoading
              ? 'bg-primary-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Connexion en cours...
            </span>
          ) : (
            'Se connecter'
          )}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;