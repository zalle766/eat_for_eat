
import { useState } from 'react';

interface RestaurantProfileProps {
  restaurant: any;
  setRestaurant: (restaurant: any) => void;
}

export default function RestaurantProfile({ restaurant, setRestaurant }: RestaurantProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    description: restaurant.description || '',
    phone: restaurant.phone || '',
    address: restaurant.address || '',
    city: restaurant.city || '',
    cuisine_type: restaurant.cuisine_type || '',
    delivery_time: restaurant.delivery_time || '',
    delivery_fee: restaurant.delivery_fee || 0,
    min_order: restaurant.min_order || 0,
    business_license: restaurant.business_license || '',
    owner_name: restaurant.owner_name || '',
    owner_email: restaurant.owner_email || '',
    owner_phone: restaurant.owner_phone || ''
  });

  const cuisineTypes = [
    'عربي',
    'إيطالي',
    'آسيوي',
    'مكسيكي',
    'هندي',
    'لبناني',
    'وجبات سريعة',
    'نباتي',
    'أخرى'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // هنا يمكن إضافة كود حفظ البيانات في قاعدة البيانات
      const updatedRestaurant = { ...restaurant, ...formData };
      setRestaurant(updatedRestaurant);
      setIsEditing(false);
      alert('تم حفظ التغييرات بنجاح!');
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: restaurant.name || '',
      description: restaurant.description || '',
      phone: restaurant.phone || '',
      address: restaurant.address || '',
      city: restaurant.city || '',
      cuisine_type: restaurant.cuisine_type || '',
      delivery_time: restaurant.delivery_time || '',
      delivery_fee: restaurant.delivery_fee || 0,
      min_order: restaurant.min_order || 0,
      business_license: restaurant.business_license || '',
      owner_name: restaurant.owner_name || '',
      owner_email: restaurant.owner_email || '',
      owner_phone: restaurant.owner_phone || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ملف المطعم</h2>
          <p className="text-gray-600">إدارة معلومات وإعدادات مطعمك</p>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <i className="ri-edit-line"></i>
            تعديل المعلومات
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <i className="ri-save-line"></i>
              حفظ التغييرات
            </button>
          </div>
        )}
      </div>

      {/* معلومات المطعم الأساسية */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">معلومات المطعم الأساسية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم المطعم</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{restaurant.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع المطبخ</label>
            {isEditing ? (
              <select
                name="cuisine_type"
                value={formData.cuisine_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {cuisineTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{restaurant.cuisine_type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{restaurant.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
            {isEditing ? (
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{restaurant.city}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
            {isEditing ? (
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{restaurant.address}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">وصف المطعم</label>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="اكتب وصفاً مختصراً عن مطعمك..."
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg min-h-[100px]">
                {restaurant.description || 'لم يتم إضافة وصف بعد'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* إعدادات التوصيل */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">إعدادات التوصيل</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">وقت التوصيل المتوقع</label>
            {isEditing ? (
              <input
                type="text"
                name="delivery_time"
                value={formData.delivery_time}
                onChange={handleInputChange}
                placeholder="مثال: 30-45 دقيقة"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{restaurant.delivery_time}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">رسوم التوصيل (dh)</label>
            {isEditing ? (
              <input
                type="number"
                name="delivery_fee"
                value={formData.delivery_fee}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{restaurant.delivery_fee} dh</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى للطلب (dh)</label>
            {isEditing ? (
              <input
                type="number"
                name="min_order"
                value={formData.min_order}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{restaurant.min_order} dh</p>
            )}
          </div>
        </div>
      </div>

      {/* معلومات المالك */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">معلومات المالك</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم المالك</label>
            {isEditing ? (
              <input
                type="text"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{restaurant.owner_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
            <p className="text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">{restaurant.owner_email}</p>
            <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير البريد الإلكتروني</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">رقم هاتف المالك</label>
            {isEditing ? (
              <input
                type="tel"
                name="owner_phone"
                value={formData.owner_phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{restaurant.owner_phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">رقم الرخصة التجارية</label>
            {isEditing ? (
              <input
                type="text"
                name="business_license"
                value={formData.business_license}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                {restaurant.business_license || 'غير محدد'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* معلومات إضافية */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">معلومات إضافية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التسجيل</label>
            <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
              {new Date(restaurant.created_at).toLocaleDateString('ar-SA')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة المطعم</label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                restaurant.status === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : restaurant.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {restaurant.status === 'approved' ? 'مقبول' : 
                 restaurant.status === 'pending' ? 'في الانتظار' : 'مرفوض'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">التقييم</label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{restaurant.rating || 0}</span>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`ri-star-${i < Math.floor(restaurant.rating || 0) ? 'fill' : 'line'} text-sm`}></i>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الموقع</label>
            <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
              {restaurant.latitude && restaurant.longitude 
                ? `${restaurant.latitude.toFixed(6)}, ${restaurant.longitude.toFixed(6)}`
                : 'غير محدد'
              }
            </p>
          </div>
        </div>
      </div>

      {/* صورة المطعم */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">صورة المطعم</h3>
        
        <div className="flex items-center gap-6">
          <img
            src={restaurant.image || 'https://readdy.ai/api/search-image?query=modern%20restaurant%20interior%20with%20warm%20lighting%20and%20elegant%20dining%20tables%2C%20professional%20food%20photography%20style%2C%20clean%20and%20inviting%20atmosphere&width=200&height=150&seq=restaurant-profile&orientation=landscape'}
            alt={restaurant.name}
            className="w-32 h-24 object-cover object-top rounded-lg border border-gray-200"
          />
          <div>
            <p className="text-sm text-gray-600 mb-3">
              صورة المطعم الحالية. يمكنك تغييرها من خلال رفع صورة جديدة.
            </p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              تغيير الصورة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
