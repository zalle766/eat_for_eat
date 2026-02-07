import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

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
  const toast = useToast();

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
          let errorMessage = 'Impossible d\'obtenir votre position';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Accès à la position refusé';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position non disponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'Délai de localisation dépassé';
              break;
          }
          
          toast.error(errorMessage);
          setIsGettingLocation(false);
        },
        options
      );
    } else {
      toast.error('Votre navigateur ne supporte pas la géolocalisation');
      setIsGettingLocation(false);
    }
  };

  // معالجة رفع الصورة
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        toast.warning('Veuillez choisir une image valide');
        return;
      }
      
      // التحقق من حجم الملف (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('La taille de l\'image ne doit pas dépasser 5 Mo');
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
      toast.warning('Veuillez entrer le nom du restaurant');
      return false;
    }
    if (!formData.ownerName.trim()) {
      toast.warning('Veuillez entrer le nom du propriétaire');
      return false;
    }
    if (!formData.email.trim()) {
      toast.warning('Veuillez entrer l\'adresse e-mail');
      return false;
    }
    if (!formData.email.includes('@')) {
      toast.warning('Veuillez entrer une adresse e-mail valide');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.warning('Veuillez entrer le numéro de téléphone');
      return false;
    }
    if (!formData.password.trim()) {
      toast.warning('Veuillez entrer le mot de passe');
      return false;
    }
    if (formData.password.length < 6) {
      toast.warning('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.warning('Le mot de passe et la confirmation ne correspondent pas');
      return false;
    }
    if (!formData.address.trim()) {
      toast.warning('Veuillez entrer l\'adresse');
      return false;
    }
    if (!formData.city.trim()) {
      toast.warning('Veuillez entrer la ville');
      return false;
    }
    if (!formData.cuisineType) {
      toast.warning('Veuillez choisir le type de cuisine');
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
          toast.error('Cette adresse e-mail est déjà utilisée');
        } else {
          toast.error('Erreur lors de la création du compte : ' + authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error('Échec de la création du compte');
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
          delivery_time: '30-45 min',
          delivery_fee: 15,
          is_open: false
        });

      if (restaurantError) {
        console.error('خطأ في حفظ بيانات المطعم:', restaurantError);
        toast.error('Compte créé mais erreur lors de l\'enregistrement du restaurant. Veuillez réessayer.');
        return;
      }

      toast.success('Votre demande a été envoyée avec succès ! Elle sera examinée par l\'équipe et vous recevrez une confirmation par e-mail.');
      
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
      toast.error('Une erreur inattendue s\'est produite. Veuillez réessayer.');
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Rejoignez notre réseau de restaurants</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Inscrivez votre restaurant et attirez plus de clients et de commandes
          </p>
          
          {/* Login Link for Existing Restaurant Owners */}
          <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-xl max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 text-orange-700 mb-2">
              <i className="ri-user-line text-lg"></i>
              <span className="font-semibold">Vous avez déjà un compte restaurant ?</span>
            </div>
            <p className="text-sm text-orange-600 mb-3">
              Si votre restaurant est déjà enregistré et approuvé, connectez-vous pour accéder au tableau de bord
            </p>
            <button
              onClick={() => navigate('/auth?mode=restaurant')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
            >
              <i className="ri-login-box-line"></i>
              <span>Connexion propriétaires</span>
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Inscrivez votre restaurant</h2>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* صورة المطعم */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Photo du restaurant *
              </label>
              <div className="flex flex-col items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-full max-w-md">
                    <img 
                      src={imagePreview} 
                      alt="Aperçu du restaurant" 
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
                    <span className="text-gray-600 font-medium">Cliquez pour ajouter une image</span>
                    <span className="text-sm text-gray-500 mt-1">PNG, JPG jusqu'à 5 Mo</span>
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
                Emplacement du restaurant *
              </label>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <i className={`ri-map-pin-line text-xl ${isGettingLocation ? 'animate-pulse' : ''}`}></i>
                  <span>{isGettingLocation ? 'Localisation en cours...' : 'Obtenir ma position'}</span>
                </button>
                
                {(formData.latitude !== 0 || formData.longitude !== 0) && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <i className="ri-check-circle-line"></i>
                      <span className="font-medium">Position enregistrée avec succès</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Latitude : {formData.latitude.toFixed(6)} | Longitude : {formData.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* معلومات أساسية */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="restaurantName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du restaurant *
                </label>
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="Nom de votre restaurant"
                />
              </div>
              
              <div>
                <label htmlFor="ownerName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du propriétaire *
                </label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="Votre nom complet"
                />
              </div>
            </div>

            {/* بيانات الاتصال */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse e-mail *
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
                  Numéro de téléphone *
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
                    placeholder="Mot de passe (6 caractères minimum)"
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
                    required
                    className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none"
                    placeholder="Répétez le mot de passe"
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
            </div>

            {/* العنوان */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="Adresse complète du restaurant"
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                  Ville *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="Ville"
                />
              </div>
            </div>

            {/* نوع المطبخ */}
            <div>
              <label htmlFor="cuisineType" className="block text-sm font-semibold text-gray-700 mb-2">
                Type de cuisine *
              </label>
              <select
                id="cuisineType"
                name="cuisineType"
                value={formData.cuisineType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              >
                <option value="">Choisissez le type de cuisine</option>
                <option value="Arab">Arabe</option>
                <option value="Italien">Italien</option>
                <option value="Asiatique">Asiatique</option>
                <option value="Mexicain">Mexicain</option>
                <option value="Indien">Indien</option>
                <option value="Libanais">Libanais</option>
                <option value="Fast-food">Fast-food</option>
                <option value="Végétarien">Végétarien</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            {/* وصف المطعم */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description du restaurant
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 resize-none"
                placeholder="Décrivez votre restaurant, spécialités, ambiance..."
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.description.length}/500 caractères
              </div>
            </div>

            {/* رقم الرخصة */}
            <div>
              <label htmlFor="businessLicense" className="block text-sm font-semibold text-gray-700 mb-2">
                N° licence commerciale
              </label>
              <input
                type="text"
                id="businessLicense"
                name="businessLicense"
                value={formData.businessLicense}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder="N° registre commercial ou licence"
              />
            </div>

            {/* رسالة إضافية */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                Message supplémentaire
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 resize-none"
                placeholder="Questions ou informations supplémentaires..."
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.message.length}/500 caractères
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                Retour à l'accueil
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Envoi en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <i className="ri-send-plane-line"></i>
                    <span>Envoyer la demande</span>
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
              <h3 className="font-semibold">Informations importantes</h3>
            </div>
            <ul className="text-sm text-blue-600 space-y-2 text-right">
              <li>• Votre demande sera examinée sous 24-48 heures</li>
              <li>• Vous recevrez une confirmation par e-mail</li>
              <li>• Vous pourrez suivre le statut de votre demande depuis votre compte</li>
              <li>• En cas d'approbation, vous aurez accès au tableau de bord pour gérer votre restaurant</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
