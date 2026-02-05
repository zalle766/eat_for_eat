
import { useState } from 'react';

interface SettingsProps {
  restaurant: any;
  setRestaurant: (restaurant: any) => void;
}

export default function Settings({ restaurant, setRestaurant }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      isOpen: true,
      autoAcceptOrders: false,
      maxOrdersPerHour: 20,
      preparationTime: 30,
      enableNotifications: true
    },
    hours: {
      monday: { open: '09:00', close: '23:00', closed: false },
      tuesday: { open: '09:00', close: '23:00', closed: false },
      wednesday: { open: '09:00', close: '23:00', closed: false },
      thursday: { open: '09:00', close: '23:00', closed: false },
      friday: { open: '09:00', close: '23:00', closed: false },
      saturday: { open: '09:00', close: '23:00', closed: false },
      sunday: { open: '09:00', close: '23:00', closed: false }
    },
    notifications: {
      newOrder: true,
      orderCancellation: true,
      lowStock: true,
      dailyReport: true,
      weeklyReport: false,
      customerReview: true
    },
    payment: {
      cashOnDelivery: true,
      creditCard: true,
      bankTransfer: false,
      digitalWallet: true
    }
  });

  const tabs = [
    { id: 'general', label: 'الإعدادات العامة', icon: 'ri-settings-3-line' },
    { id: 'hours', label: 'ساعات العمل', icon: 'ri-time-line' },
    { id: 'notifications', label: 'الإشعارات', icon: 'ri-notification-3-line' },
    { id: 'payment', label: 'طرق الدفع', icon: 'ri-money-dollar-circle-line' }
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'الاثنين' },
    { key: 'tuesday', label: 'الثلاثاء' },
    { key: 'wednesday', label: 'الأربعاء' },
    { key: 'thursday', label: 'الخميس' },
    { key: 'friday', label: 'الجمعة' },
    { key: 'saturday', label: 'السبت' },
    { key: 'sunday', label: 'الأحد' }
  ];

  const handleSaveSettings = () => {
    alert('تم حفظ الإعدادات بنجاح!');
  };

  const toggleRestaurantStatus = () => {
    setSettings(prev => ({
      ...prev,
      general: {
        ...prev.general,
        isOpen: !prev.general.isOpen
      }
    }));
  };

  const updateHours = (day: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day as keyof typeof prev.hours],
          [field]: value
        }
      }
    }));
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      {/* حالة المطعم */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">حالة المطعم</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">المطعم مفتوح</h4>
            <p className="text-sm text-gray-600">تحكم في قبول الطلبات الجديدة</p>
          </div>
          <button
            onClick={toggleRestaurantStatus}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.general.isOpen ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.general.isOpen ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* إعدادات الطلبات */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">إعدادات الطلبات</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">قبول تلقائي للطلبات</h4>
              <p className="text-sm text-gray-600">قبول الطلبات تلقائياً بدون تدخل يدوي</p>
            </div>
            <button
              onClick={() => setSettings(prev => ({
                ...prev,
                general: { ...prev.general, autoAcceptOrders: !prev.general.autoAcceptOrders }
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.general.autoAcceptOrders ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.general.autoAcceptOrders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحد الأقصى للطلبات في الساعة
            </label>
            <input
              type="number"
              value={settings.general.maxOrdersPerHour}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                general: { ...prev.general, maxOrdersPerHour: parseInt(e.target.value) }
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وقت التحضير الافتراضي (بالدقائق)
            </label>
            <input
              type="number"
              value={settings.general.preparationTime}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                general: { ...prev.general, preparationTime: parseInt(e.target.value) }
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              min="5"
              max="120"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderHoursSettings = () => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">ساعات العمل</h3>
      <div className="space-y-4">
        {daysOfWeek.map((day) => (
          <div key={day.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-20">
              <span className="text-sm font-medium text-gray-900">{day.label}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!settings.hours[day.key as keyof typeof settings.hours].closed}
                onChange={(e) => updateHours(day.key, 'closed', !e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-600">مفتوح</span>
            </div>

            {!settings.hours[day.key as keyof typeof settings.hours].closed && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">من:</label>
                  <input
                    type="time"
                    value={settings.hours[day.key as keyof typeof settings.hours].open}
                    onChange={(e) => updateHours(day.key, 'open', e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">إلى:</label>
                  <input
                    type="time"
                    value={settings.hours[day.key as keyof typeof settings.hours].close}
                    onChange={(e) => updateHours(day.key, 'close', e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                </div>
              </>
            )}

            {settings.hours[day.key as keyof typeof settings.hours].closed && (
              <span className="text-sm text-red-600 font-medium">مغلق</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotificationsSettings = () => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">إعدادات الإشعارات</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">طلب جديد</h4>
            <p className="text-sm text-gray-600">إشعار عند استلام طلب جديد</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({
              ...prev,
              notifications: { ...prev.notifications, newOrder: !prev.notifications.newOrder }
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.notifications.newOrder ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications.newOrder ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">إلغاء طلب</h4>
            <p className="text-sm text-gray-600">إشعار عند إلغاء طلب</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({
              ...prev,
              notifications: { ...prev.notifications, orderCancellation: !prev.notifications.orderCancellation }
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.notifications.orderCancellation ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications.orderCancellation ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">تقييم جديد</h4>
            <p className="text-sm text-gray-600">إشعار عند استلام تقييم من عميل</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({
              ...prev,
              notifications: { ...prev.notifications, customerReview: !prev.notifications.customerReview }
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.notifications.customerReview ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications.customerReview ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">تقرير يومي</h4>
            <p className="text-sm text-gray-600">تقرير يومي بالمبيعات والطلبات</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({
              ...prev,
              notifications: { ...prev.notifications, dailyReport: !prev.notifications.dailyReport }
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.notifications.dailyReport ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications.dailyReport ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">طرق الدفع المقبولة</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
            <div>
              <h4 className="font-medium text-gray-900">الدفع نقداً عند التوصيل</h4>
              <p className="text-sm text-gray-600">قبول الدفع النقدي عند التوصيل</p>
            </div>
          </div>
          <button
            onClick={() => setSettings(prev => ({
              ...prev,
              payment: { ...prev.payment, cashOnDelivery: !prev.payment.cashOnDelivery }
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.payment.cashOnDelivery ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.payment.cashOnDelivery ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <i className="ri-bank-card-line text-2xl text-blue-600"></i>
            <div>
              <h4 className="font-medium text-gray-900">بطاقة ائتمان</h4>
              <p className="text-sm text-gray-600">قبول الدفع بالبطاقات الائتمانية</p>
            </div>
          </div>
          <button
            onClick={() => setSettings(prev => ({
              ...prev,
              payment: { ...prev.payment, creditCard: !prev.payment.creditCard }
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.payment.creditCard ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.payment.creditCard ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <i className="ri-smartphone-line text-2xl text-purple-600"></i>
            <div>
              <h4 className="font-medium text-gray-900">محفظة رقمية</h4>
              <p className="text-sm text-gray-600">قبول الدفع عبر المحافظ الرقمية</p>
            </div>
          </div>
          <button
            onClick={() => setSettings(prev => ({
              ...prev,
              payment: { ...prev.payment, digitalWallet: !prev.payment.digitalWallet }
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.payment.digitalWallet ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.payment.digitalWallet ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <i className="ri-bank-line text-2xl text-orange-600"></i>
            <div>
              <h4 className="font-medium text-gray-900">تحويل بنكي</h4>
              <p className="text-sm text-gray-600">قبول الدفع عبر التحويل البنكي</p>
            </div>
          </div>
          <button
            onClick={() => setSettings(prev => ({
              ...prev,
              payment: { ...prev.payment, bankTransfer: !prev.payment.bankTransfer }
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.payment.bankTransfer ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.payment.bankTransfer ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'hours':
        return renderHoursSettings();
      case 'notifications':
        return renderNotificationsSettings();
      case 'payment':
        return renderPaymentSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">الإعدادات</h2>
          <p className="text-gray-600">إدارة إعدادات مطعمك وتفضيلاتك</p>
        </div>
        
        <button
          onClick={handleSaveSettings}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <i className="ri-save-line"></i>
          حفظ جميع الإعدادات
        </button>
      </div>

      {/* تبويبات الإعدادات */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" dir="ltr">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={tab.icon}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
