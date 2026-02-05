import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function RestaurantSignupPage() {
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    cuisineType: '',
    description: '',
    businessLicense: '',
    message: '',
    latitude: 0,
    longitude: 0
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const navigate = useNavigate();

  // معالجة تغيير المدخلات
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // جلب الموقع الحالي
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            latitude,
            longitude
          }));
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('خطأ في تحديد الموقع:', error);
          let errorMessage = 'لا يمكن الحصول على موقعك';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'تم رفض إذن الوصول للموقع';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'الموقع غير متاح حالياً';
              break;
            case error.TIMEOUT:
              errorMessage = 'انتهت مهلة تحديد الموقع';
              break;
          }
          
          alert(errorMessage);
          setIsGettingLocation(false);
        },
        options
      );
    } else {
      alert('متصفحك لا يدعم تحديد الموقع');
      setIsGettingLocation(false);
    }
  };

  // معالجة رفع الصورة
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار صورة صحيحة');
        return;
      }
      
      // التحقق من حجم الملف (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
        return;
      }
      
      setImageFile(file);
      
      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // إزالة الصورة
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const validateForm = () => {
    if (!formData.restaurantName.trim()) {
      alert('يرجى إدخال اسم المطعم');
      return false;
    }
    if (!formData.ownerName.trim()) {
      alert('يرجى إدخال اسم المالك');
      return false;
    }
    if (!formData.email.trim()) {
      alert('يرجى إدخال البريد الإلكتروني');
      return false;
    }
    if (!formData.email.includes('@')) {
      alert('يرجى إدخال بريد إلكتروني صحيح');
      return false;
    }
    if (!formData.phone.trim()) {
      alert('يرجى إدخال رقم الهاتف');
      return false;
    }
    if (!formData.password.trim()) {
      alert('يرجى إدخال كلمة المرور');
      return false;
    }
    if (formData.password.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
      return false;
    }
    if (!formData.address.trim()) {
      alert('يرجى إدخال العنوان');
      return false;
    }
    if (!formData.city.trim()) {
      alert('يرجى إدخال المدينة');
      return false;
    }
    if (!formData.cuisineType) {
      alert('يرجى اختيار نوع المطبخ');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // إنشاء حساب المستخدم أولاً
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.ownerName.trim(),
            phone: formData.phone.trim(),
            user_type: 'restaurant_owner'
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          alert('هذا البريد الإلكتروني مسجل مسبقاً');
        } else {
          alert('خطأ في إنشاء الحساب: ' + authError.message);
        }
        return;
      }

      if (!authData.user) {
        alert('فشل في إنشاء الحساب');
        return;
      }

      // رفع الصورة إذا كانت موجودة
      let imageUrl = '';
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('restaurant-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error('خطأ في رفع الصورة:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('restaurant-images')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }

      // إدراج بيانات المطعم
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          name: formData.restaurantName.trim(),
          owner_name: formData.ownerName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          cuisine_type: formData.cuisineType,
          description: formData.description.trim() || null,
          business_license: formData.businessLicense.trim() || null,
          message: formData.message.trim() || null,
          latitude: formData.latitude || 0,
          longitude: formData.longitude || 0,
          image_url: imageUrl || null,
          status: 'pending',
          owner_id: authData.user.id,
          rating: 0,
          delivery_time: '30-45 دقيقة',
          delivery_fee: 15,
          is_open: false
        });

      if (restaurantError) {
        console.error('خطأ في حفظ بيانات المطعم:', restaurantError);
        alert('تم إنشاء الحساب ولكن فشل في حفظ بيانات المطعم. يرجى المحاولة مرة أخرى.');
        return;
      }

      alert('تم إرسال طلبك بنجاح! سيتم مراجعته من قبل الإدارة وستصلك رسالة تأكيد قريباً.');
      
      // إعادة تعيين النموذج
      setFormData({
        restaurantName: '',
        ownerName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        address: '',
        city: '',
        cuisineType: '',
        description: '',
        businessLicense: '',
        message: '',
        latitude: 0,
        longitude: 0
      });
      setImageFile(null);
      setImagePreview(null);
      
      // التوجيه لصفحة تسجيل الدخول
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      alert('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <i className="ri-restaurant-line text-3xl text-white"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">انضم إلى شبكة مطاعمنا</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            سجل مطعمك معنا واحصل على المزيد من العملاء والطلبات
          </p>
          
          {/* Login Link for Existing Restaurant Owners */}
          <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-xl max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 text-orange-700 mb-2">
              <i className="ri-user-line text-lg"></i>
              <span className="font-semibold">لديك حساب مطعم بالفعل؟</span>
            </div>
            <p className="text-sm text-orange-600 mb-3">
              إذا كان مطعمك مسجلاً مسبقاً ومقبولاً، يمكنك الدخول مباشرة إلى لوحة التحكم
            </p>
            <button
              onClick={() => navigate('/auth?mode=restaurant')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
            >
              <i className="ri-login-box-line"></i>
              <span>تسجيل الدخول لأصحاب المطاعم</span>
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-8">سجل مطعمك</h2>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* صورة المطعم */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                صورة المطعم *
              </label>
              <div className="flex flex-col items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-full max-w-md">
                    <img 
                      src={imagePreview} 
                      alt="معاينة صورة المطعم" 
                      className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ) : (
                  <label className="w-full max-w-md h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
                    <i className="ri-image-add-line text-5xl text-gray-400 mb-2"></i>
                    <span className="text-gray-600 font-medium">اضغط لإضافة صورة</span>
                    <span className="text-sm text-gray-500 mt-1">PNG, JPG حتى 5 ميجابايت</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* الموقع */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                موقع المطعم *
              </label>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <i className={`ri-map-pin-line text-xl ${isGettingLocation ? 'animate-pulse' : ''}`}></i>
                  <span>{isGettingLocation ? 'جاري تحديد الموقع...' : 'احصل على موقعي'}</span>
                </button>
                
                {(formData.latitude !== 0 || formData.longitude !== 0) && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <i className="ri-check-circle-line"></i>
                      <span className="font-medium">تم تحديد الموقع بنجاح</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      خط العرض: {formData.latitude.toFixed(6)} | خط الطول: {formData.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* معلومات أساسية */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="restaurantName" className="block text-sm font-semibold text-gray-700 mb-2">
                  اسم المطعم *
                </label>
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="اسم مطعمك"
                />
              </div>
              
              <div>
                <label htmlFor="ownerName" className="block text-sm font-semibold text-gray-700 mb-2">
                  اسم المالك *
                </label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="اسمك الكامل"
                />
              </div>
            </div>

            {/* بيانات الاتصال */}
            <div className="grid md:grid-cols-2 gap-6">
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
              
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="+966 50 123 4567"
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div className="grid md:grid-cols-2 gap-6">
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
                    placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
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
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  تأكيد كلمة المرور *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="أعد إدخال كلمة المرور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className={showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
              </div>
            </div>

            {/* العنوان */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                  العنوان *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="العنوان الكامل للمطعم"
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                  المدينة *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="المدينة"
                />
              </div>
            </div>

            {/* نوع المطبخ */}
            <div>
              <label htmlFor="cuisineType" className="block text-sm font-semibold text-gray-700 mb-2">
                نوع المطبخ *
              </label>
              <select
                id="cuisineType"
                name="cuisineType"
                value={formData.cuisineType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              >
                <option value="">اختر نوع المطبخ</option>
                <option value="عربي">عربي</option>
                <option value="إيطالي">إيطالي</option>
                <option value="آسيوي">آسيوي</option>
                <option value="مكسيكي">مكسيكي</option>
                <option value="هندي">هندي</option>
                <option value="لبناني">لبناني</option>
                <option value="وجبات سريعة">وجبات سريعة</option>
                <option value="نباتي">نباتي</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            {/* وصف المطعم */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                وصف المطعم
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 resize-none"
                placeholder="اوصف مطعمك، التخصصات، الأجواء..."
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.description.length}/500 حرف
              </div>
            </div>

            {/* رقم الرخصة */}
            <div>
              <label htmlFor="businessLicense" className="block text-sm font-semibold text-gray-700 mb-2">
                رقم الرخصة التجارية
              </label>
              <input
                type="text"
                id="businessLicense"
                name="businessLicense"
                value={formData.businessLicense}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder="رقم السجل التجاري أو الرخصة"
              />
            </div>

            {/* رسالة إضافية */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                رسالة إضافية
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 resize-none"
                placeholder="أسئلة أو معلومات إضافية..."
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.message.length}/500 حرف
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                العودة للرئيسية
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري الإرسال...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <i className="ri-send-plane-line"></i>
                    <span>إرسال الطلب</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-blue-700 mb-3">
              <i className="ri-information-line text-xl"></i>
              <h3 className="font-semibold">معلومات مهمة</h3>
            </div>
            <ul className="text-sm text-blue-600 space-y-2 text-right">
              <li>• سيتم مراجعة طلبك خلال 24-48 ساعة</li>
              <li>• ستصلك رسالة تأكيد على البريد الإلكتروني</li>
              <li>• يمكنك تتبع حالة طلبك من خلال حسابك</li>
              <li>• في حالة الموافقة، ستحصل على لوحة تحكم لإدارة مطعمك</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
