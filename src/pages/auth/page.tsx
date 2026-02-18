
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Footer from '../../components/feature/Footer';
import PhoneInput from '../../components/ui/PhoneInput';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isRestaurantMode, setIsRestaurantMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectTo = (location.state as { from?: string })?.from === 'checkout' ? '/checkout' : '/';

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
      await redirectUserBasedOnType(user, redirectTo);
    }
  };

  const redirectUserBasedOnType = async (user: any, defaultRedirect = '/') => {
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

      navigate(defaultRedirect);
    } catch (error) {
      console.error('Erreur lors de la vérification du type d\'utilisateur:', error);
      navigate(defaultRedirect);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      if (!formData.phone.trim()) {
        setMessage('Veuillez entrer votre numéro de téléphone');
        setMessageType('error');
        return false;
      }
      if (formData.password.length < 6) {
        setMessage('Le mot de passe doit contenir au moins 6 caractères');
        setMessageType('error');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setMessage('Le mot de passe et la confirmation ne correspondent pas');
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
            await redirectUserBasedOnType(data.user, redirectTo);
          }, 1000);
        }
      } else {
        // التقاط موقع الزبون تلقائياً (كما في عرض المطاعم القريبة)
        const locationData = await new Promise<{ latitude: number; longitude: number; address: string; city: string } | null>((resolve) => {
          if (!navigator.geolocation) {
            setMessage('La géolocalisation n\'est pas supportée par votre navigateur');
            setMessageType('error');
            resolve(null);
            return;
          }

          setMessage('Localisation en cours... Autorisez l\'accès à votre position.');
          setMessageType('success');

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr`
                );
                const data = await response.json();
                const address = data.display_name || `${latitude}, ${longitude}`;
                const city = data.address?.city || data.address?.town || data.address?.village || '';
                resolve({ latitude, longitude, address, city });
              } catch (err) {
                console.error('Erreur reverse geocoding:', err);
                resolve({ latitude, longitude, address: `${latitude}, ${longitude}`, city: '' });
              }
            },
            (error) => {
              let errorMessage = 'Impossible d\'obtenir votre position';
              if (error.code === error.PERMISSION_DENIED) {
                errorMessage = 'Veuillez autoriser l\'accès à la localisation pour créer un compte.';
              } else if (error.code === error.POSITION_UNAVAILABLE) {
                errorMessage = 'Localisation indisponible. Activez le GPS.';
              } else if (error.code === error.TIMEOUT) {
                errorMessage = 'Délai de localisation expiré. Réessayez.';
              }
              setMessage(errorMessage);
              setMessageType('error');
              resolve(null);
            },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
          );
        });

        if (!locationData) {
          setIsLoading(false);
          return;
        }

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
          try {
            await supabase
              .from('users')
              .update({
                phone: formData.phone.trim() || null,
                address: locationData.address,
                city: locationData.city || null,
                latitude: locationData.latitude,
                longitude: locationData.longitude
              })
              .eq('auth_id', data.user.id);
          } catch (err) {
            console.error('Erreur lors de la mise à jour du profil:', err);
          }
          setMessage('Compte créé avec succès !');
          setMessageType('success');
          if (data.session) {
            await redirectUserBasedOnType(data.user, redirectTo);
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
      <main className="pt-12 pb-12 px-4 sm:px-6 lg:px-8">
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
                <PhoneInput
                  label="Téléphone"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={(v) => setFormData(prev => ({ ...prev, phone: v }))}
                  required
                  placeholder="6 12 34 56 78"
                />
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none"
                    placeholder={isLogin ? "Mot de passe" : "Mot de passe (6 caractères minimum)"}
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

              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required={!isLogin}
                      className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none"
                      placeholder="Confirmez votre mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="px-4 py-3 border-l border-gray-300 bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <i className={showConfirmPassword ? 'ri-eye-off-line text-xl' : 'ri-eye-line text-xl'}></i>
                    </button>
                  </div>
                </div>
              )}

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
                        confirmPassword: '',
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
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
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
                <div className="text-center">
                  <p className="text-gray-600 mb-3">Vous souhaitez devenir livreur (motard) ?</p>
                  <button
                    type="button"
                    onClick={() => navigate('/driver-signup')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <i className="ri-motorbike-line"></i>
                      <span>S'inscrire comme livreur</span>
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
