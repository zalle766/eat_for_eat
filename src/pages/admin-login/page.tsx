
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanEmail = formData.email.trim().toLowerCase();

      // جلب بيانات المدير
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', cleanEmail)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        throw new Error('Email introuvable ou compte inactif');
      }

      // التحقق من كلمة المرور
      if (formData.password !== adminData.password) {
        throw new Error('Mot de passe incorrect');
      }

      // حفظ بيانات المدير
      localStorage.setItem('adminSession', JSON.stringify({
        id: adminData.id,
        name: adminData.name,
        email: adminData.email,
        role: adminData.role,
        isLoggedIn: true
      }));

      // تحديث آخر تسجيل دخول
      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminData.id);

      // التوجيه مباشرة
      navigate('/admin', { replace: true });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur s\'est produite lors de la connexion');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-admin-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connexion Administrateur</h1>
          <p className="text-gray-600">Entrez vos identifiants pour accéder au panneau d'administration</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-500 mr-2"></i>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse Email
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="admin@fooddelivery.com"
                required
                dir="ltr"
              />
              <i className="ri-mail-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de Passe
            </label>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none"
                placeholder="Entrez votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-4 py-3 border-l border-gray-300 bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <i className={showPassword ? 'ri-eye-off-line text-xl' : 'ri-eye-line text-xl'}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center whitespace-nowrap"
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Connexion en cours...
              </>
            ) : (
              <>
                <i className="ri-login-box-line mr-2"></i>
                Se Connecter
              </>
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Comptes de test :</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• admin@fooddelivery.com</p>
            <p>• ahmed@fooddelivery.com</p>
            <p>• fatima@fooddelivery.com</p>
            <p>• mohammed@fooddelivery.com</p>
            <p>• nora@fooddelivery.com</p>
            <p>• abdullah@fooddelivery.com</p>
            <p className="font-medium mt-2">Mot de passe : admin123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
