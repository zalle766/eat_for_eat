
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
    // التحقق من وجود مستخدم مسجل دخول
    checkUser();
    
    // التحقق من معاملات URL
    const mode = searchParams.get('mode');
    if (mode === 'restaurant') {
      setIsRestaurantMode(true);
      setIsLogin(true);
      setMessage('يرجى تسجيل الدخول للوصول إلى لوحة تحكم المطعم');
      setMessageType('success');
    }
  }, [searchParams]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // التحقق من نوع المستخدم وتوجيهه للصفحة المناسبة
      await redirectUserBasedOnType(user);
    }
  };

  const redirectUserBasedOnType = async (user: any) => {
    try {
      // التحقق من وجود مطعم مقبول لهذا المستخدم
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'approved')
        .single();

      if (restaurant && !restaurantError) {
        // صاحب مطعم مقبول - توجيه للوحة التحكم
        navigate('/restaurant-dashboard');
        return;
      }

      // التحقق من كونه مدير
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();

      if (admin && !adminError) {
        // مدير - توجيه للوحة الإدارة
        navigate('/admin');
        return;
      }

      // التحقق من وجود مطعم في الانتظار
      const { data: pendingRestaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'pending')
        .single();

      if (pendingRestaurant) {
        // صاحب مطعم في الانتظار - توجيه للصفحة الرئيسية
        navigate('/');
        return;
      }

      // مستخدم عادي - توجيه للصفحة الرئيسية
      navigate('/');
    } catch (error) {
      console.error('خطأ في تحديد نوع المستخدم:', error);
      // في حالة الخطأ، توجيه للصفحة الرئيسية
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
      setMessage('يرجى إدخال البريد الإلكتروني');
      setMessageType('error');
      return false;
    }
    if (!formData.email.includes('@')) {
      setMessage('يرجى إدخال بريد إلكتروني صحيح');
      setMessageType('error');
      return false;
    }
    if (!formData.password.trim()) {
      setMessage('يرجى إدخال كلمة المرور');
      setMessageType('error');
      return false;
    }
    if (!isLogin) {
      if (!formData.name.trim()) {
        setMessage('يرجى إدخال الاسم');
        setMessageType('error');
        return false;
      }
      if (formData.password.length < 6) {
        setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
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
        // تسجيل الدخول
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          } else if (error.message.includes('Email not confirmed')) {
            setMessage('يرجى تأكيد البريد الإلكتروني أولاً');
          } else if (error.message.includes('Too many requests')) {
            setMessage('محاولات كثيرة جداً. يرجى المحاولة لاحقاً');
          } else {
            setMessage('خطأ في تسجيل الدخول: ' + error.message);
          }
          setMessageType('error');
          return;
        }

        if (data.user) {
          setMessage('تم تسجيل الدخول بنجاح!');
          setMessageType('success');
          
          // انتظار قصير قبل التوجيه
          setTimeout(async () => {
            await redirectUserBasedOnType(data.user);
          }, 1000);
        }
      } else {
        // إنشاء حساب جديد
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
            setMessage('هذا البريد الإلكتروني مسجل مسبقاً');
          } else if (error.message.includes('Password should be at least')) {
            setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
          } else {
            setMessage('خطأ في إنشاء الحساب: ' + error.message);
          }
          setMessageType('error');
          return;
        }

        if (data.user) {
          setMessage('تم إنشاء الحساب بنجاح! يرجى تأكيد البريد الإلكتروني');
          setMessageType('success');
          
          // إعادة تعيين النموذج
          setFormData({
            email: '',
            password: '',
            name: '',
            phone: ''
          });
          
          // التبديل لوضع تسجيل الدخول
          setIsLogin(true);
        }
      }
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      setMessage('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="ri-user-line text-2xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin 
                ? (isRestaurantMode ? 'تسجيل الدخول لأصحاب المطاعم' : 'تسجيل الدخول')
                : 'إنشاء حساب جديد'}
            </h1>
            <p className="text-gray-600">
              {isLogin 
                ? (isRestaurantMode
                  ? 'أدخل بريد المطعم وكلمة المرور للدخول إلى لوحة التحكم'
                  : 'أدخل بياناتك للوصول إلى حسابك')
                : 'أنشئ حساباً جديداً للاستمتاع بخدماتنا'
              }
            </p>
          </div>

          {/* Message */}
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

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name field for signup (العملاء فقط) */}
              {!isLogin && !isRestaurantMode && (
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="اسمك الكامل"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="your@email.com"
                />
              </div>

              {/* Phone field for signup (العملاء فقط) */}
              {!isLogin && !isRestaurantMode && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="+966 50 123 4567"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  كلمة المرور *
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
                    placeholder={isLogin ? "كلمة المرور" : "كلمة المرور (6 أحرف على الأقل)"}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isLogin ? 'جاري تسجيل الدخول...' : 'جاري إنشاء الحساب...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <i className={`ri-${isLogin ? 'login-box' : 'user-add'}-line`}></i>
                    <span>{isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}</span>
                  </div>
                )}
              </button>
            </form>

            {/* Toggle Mode (مخفي في وضع أصحاب المطاعم) */}
            {!isRestaurantMode && (
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
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
                    {isLogin ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                  </button>
                </p>
              </div>
            )}

            {/* Restaurant Registration Link (مخفي في وضع أصحاب المطاعم) */}
            {!isRestaurantMode && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-gray-600 mb-3">هل تريد تسجيل مطعمك معنا؟</p>
                  <button
                    type="button"
                    onClick={() => navigate('/restaurant-signup')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <i className="ri-restaurant-line"></i>
                      <span>سجل مطعمك الآن</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                <i className="ri-information-line"></i>
                <span className="font-semibold">معلومات مهمة</span>
              </div>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• أصحاب المطاعم المقبولة يحصلون على لوحة تحكم خاصة</li>
                <li>• يمكن إدارة المطعم والمنتجات والطلبات بسهولة</li>
                <li>• تتبع الإحصائيات والتقارير المفصلة</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
