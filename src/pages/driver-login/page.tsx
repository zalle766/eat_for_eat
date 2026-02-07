import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';

export default function DriverLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      if (data.user) {
        // التحقق من أن المستخدم سائق - استخدام auth_id بدلاً من id
        const { data: driver, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .eq('auth_id', data.user.id)
          .single();

        if (driverError || !driver) {
          await supabase.auth.signOut();
          throw new Error('Ce compte n\'est pas un compte livreur');
        }

        if (driver.status === 'pending') {
          await supabase.auth.signOut();
          throw new Error('Votre compte est en cours d\'examen. Vous serez notifié lors de l\'approbation.');
        }

        if (driver.status === 'rejected') {
          await supabase.auth.signOut();
          throw new Error('Votre demande d\'inscription a été refusée');
        }

        // الانتقال إلى لوحة التحكم
        navigate('/driver-dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur s\'est produite lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 pt-24 pb-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-truck-line text-4xl text-orange-600"></i>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion livreur</h1>
              <p className="text-gray-600">Connectez-vous pour commencer les livraisons</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  <i className="ri-error-warning-line ml-2"></i>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>
                    Connexion en cours...
                  </span>
                ) : (
                  'Se connecter'
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Pas encore de compte ?{' '}
                  <a href="/driver-signup" className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer">
                    Inscrivez-vous comme livreur
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
