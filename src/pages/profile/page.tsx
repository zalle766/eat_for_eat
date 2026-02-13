import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/auth');
        return;
      }

      // التحقق من كون المستخدم صاحب مطعم مقبول
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'approved')
        .single();

      if (restaurant) {
        // صاحب مطعم مقبول - توجيه للوحة التحكم
        navigate('/restaurant-dashboard');
        return;
      }

      // التحقق من كونه مدير
      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();

      if (admin) {
        // مدير - توجيه للوحة الإدارة
        navigate('/admin');
        return;
      }

      setUser(user);
      await loadProfile(user.id);
    } catch (error) {
      console.error('خطأ في التحقق من المستخدم:', error);
      navigate('/auth');
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // المستخدم غير موجود في جدول users، نقوم بإنشائه
        console.log('إنشاء ملف شخصي جديد للمستخدم...');
        await createUserProfile(userId);
        return;
      }

      if (error) {
        console.error('خطأ في تحميل الملف الشخصي:', error);
        setMessage('Erreur lors du chargement des données');
        setMessageType('error');
      } else if (data) {
        setProfile(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || ''
        });
      }
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      setMessage('Une erreur inattendue s\'est produite');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Aucune session active');
      }

      const authUser = session.user;

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          auth_id: userId,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Nouvel utilisateur',
          email: authUser.email,
          phone: authUser.user_metadata?.phone || ''
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Échec de la création du profil');
      }

      // إعادة تحميل الملف الشخصي
      await loadProfile(userId);
    } catch (error) {
      console.error('خطأ في إنشاء الملف الشخصي:', error);
      setMessage('Erreur lors de la création du profil');
      setMessageType('error');
      setIsLoading(false);
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
    if (!formData.name.trim()) {
      setMessage('Veuillez entrer votre nom');
      setMessageType('error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim() || null,
          city: formData.city.trim() || null
        })
        .eq('auth_id', user.id);

      if (error) {
        console.error('خطأ في تحديث الملف الشخصي:', error);
        setMessage('Erreur lors de la mise à jour des données');
        setMessageType('error');
        return;
      }

      setMessage('Profil mis à jour avec succès !');
      setMessageType('success');

      // إعادة تحميل البيانات
      await loadProfile(user.id);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      setMessage('Une erreur inattendue s\'est produite');
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Header />
        <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Header />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="ri-user-line text-2xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon profil</h1>
            <p className="text-gray-600">Gérez vos données personnelles</p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl border ${messageType === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
              }`}>
              <div className="flex items-center gap-2">
                <i className={`ri-${messageType === 'success' ? 'check-circle' : 'error-warning'}-line`}></i>
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* Profile Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (Read Only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Name */}
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
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="Votre nom complet"
                />
              </div>

              {/* Phone */}
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

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse de livraison
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="Rue, quartier, numéro..."
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                  Ville
                </label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                >
                  <option value="">Choisir la ville</option>
                  <option value="Casablanca">Casablanca</option>
                  <option value="Rabat">Rabat</option>
                  <option value="Fès">Fès</option>
                  <option value="Marrakech">Marrakech</option>
                  <option value="Tanger">Tanger</option>
                  <option value="Agadir">Agadir</option>
                  <option value="Meknès">Meknès</option>
                  <option value="Oujda">Oujda</option>
                  <option value="Kénitra">Kénitra</option>
                  <option value="Tétouan">Tétouan</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Mise à jour...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <i className="ri-save-line"></i>
                    <span>Enregistrer les modifications</span>
                  </div>
                )}
              </button>
            </form>

            {/* Logout Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-2">
                  <i className="ri-logout-box-line"></i>
                  <span>Déconnexion</span>
                </div>
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                <i className="ri-information-line"></i>
                <span className="font-semibold">Informations du compte</span>
              </div>
              <p className="text-sm text-blue-600">
                Vous pouvez mettre à jour vos informations personnelles à tout moment. L'email ne peut pas être modifié.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
