
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isRestaurantMode, setIsRestaurantMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkUser();
    const mode = searchParams.get('mode');
    if (mode === 'restaurant') {
      setIsRestaurantMode(true);
      setIsLogin(true);
      setMessage('Veuillez vous connecter pour accéder au tableau de bord du restaurant');
      setMessageType('success');
    }
  }, [searchParams]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await redirectUserBasedOnType(user);
    }
  };

  const redirectUserBasedOnType = async (user: any) => {
    try {
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'approved')
        .single();

      if (restaurant && !restaurantError) {
        navigate('/restaurant-dashboard');
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();

      if (admin && !adminError) {
        navigate('/admin');
        return;
      }

      const { data: pendingRestaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'pending')
        .single();

      if (pendingRestaurant) {
        navigate('/');
        return;
      }

      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la vérification du type d\'utilisateur:', error);
      navigate('/');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setMessage('Veuillez entrer votre adresse email');
      setMessageType('error');
      return false;
    }
    if (!formData.email.includes('@')) {
      setMessage('Veuillez entrer une adresse email valide');
      setMessageType('error');
      return false;
    }
    if (!formData.password.trim()) {
      setMessage('Veuillez entrer votre mot de passe');
      setMessageType('error');
      return false;
    }
    if (!isLogin) {
      if (!formData.name.trim()) {
        setMessage('Veuillez entrer votre nom');
        setMessageType('error');
        return false;
      }
      if (formData.password.length < 6) {
        setMessage('Le mot de passe doit contenir au moins 6 caractères');
        setMessageType('error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setMessage('Email ou mot de passe incorrect');
          } else if (error.message.includes('Email not confirmed')) {
            setMessage('Veuillez confirmer votre email d\'abord');
          } else if (error.message.includes('Too many requests')) {
            setMessage('Trop de tentatives. Veuillez réessayer plus tard');
          } else {
            setMessage('Erreur de connexion: ' + error.message);
          }
          setMessageType('error');
          return;
        }

        if (data.user) {
          setMessage('Connexion réussie !');
          setMessageType('success');
          setTimeout(async () => {
            await redirectUserBasedOnType(data.user);
          }, 1000);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              name: formData.name.trim(),
              phone: formData.phone.trim(),
              user_type: 'customer'
            }
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            setMessage('Cet email est déjà enregistré');
          } else if (error.message.includes('Password should be at least')) {
            setMessage('Le mot de passe doit contenir au moins 6 caractères');
          } else {
            setMessage('Erreur lors de la création du compte: ' + error.message);
          }
          setMessageType('error');
          return;
        }

        if (data.user) {
          setMessage('Compte créé avec succès !');
          setMessageType('success');
          if (data.session) {
            await redirectUserBasedOnType(data.user);
          } else {
            navigate('/?registered=1', { replace: true });
          }
        }
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      setMessage('Une erreur inattendue s\'est produite. Veuillez réessayer.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Header />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="ri-user-line text-2xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin 
                ? (isRestaurantMode ? 'Connexion pour les restaurants' : 'Connexion')
                : 'Créer un compte'}
            </h1>
            <p className="text-gray-600">
              {isLogin 
                ? (isRestaurantMode
                  ? 'Entrez l\'email et le mot de passe du restaurant pour accéder au tableau de bord'
                  : 'Entrez vos identifiants pour accéder à votre compte')
                : 'Créez un compte pour profiter de nos services'
              }
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl border ${
              messageType === 'success' 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                <i className={`ri-${messageType === 'success' ? 'check-circle' : 'error-warning'}-line`}></i>
                <span>{message}</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && !isRestaurantMode && (
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="Votre nom complet"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="votre@email.com"
                />
              </div>

              {!isLogin && !isRestaurantMode && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder={isLogin ? "Mot de passe" : "Mot de passe (6 caractères minimum)"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isLogin ? 'Connexion en cours...' : 'Création du compte...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <i className={`ri-${isLogin ? 'login-box' : 'user-add'}-line`}></i>
                    <span>{isLogin ? 'Se connecter' : 'Créer le compte'}</span>
                  </div>
                )}
              </button>
            </form>

            {!isRestaurantMode && (
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setMessage('');
                      setFormData({
                        email: '',
                        password: '',
                        name: '',
                        phone: ''
                      });
                    }}
                    className="mr-2 text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                  >
                    {isLogin ? 'Créer un compte' : 'Se connecter'}
                  </button>
                </p>
              </div>
            )}

            {!isRestaurantMode && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-gray-600 mb-3">Vous souhaitez enregistrer votre restaurant ?</p>
                  <button
                    type="button"
                    onClick={() => navigate('/restaurant-signup')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <i className="ri-restaurant-line"></i>
                      <span>Enregistrer votre restaurant</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                <i className="ri-information-line"></i>
                <span className="font-semibold">Informations importantes</span>
              </div>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Les restaurants approuvés bénéficient d'un tableau de bord dédié</li>
                <li>• Gérez facilement le menu, les produits et les commandes</li>
                <li>• Suivez les statistiques et rapports détaillés</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
