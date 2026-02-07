
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
    { id: 'general', label: 'Paramètres généraux', icon: 'ri-settings-3-line' },
    { id: 'hours', label: 'Horaires', icon: 'ri-time-line' },
    { id: 'notifications', label: 'Notifications', icon: 'ri-notification-3-line' },
    { id: 'payment', label: 'Paiement', icon: 'ri-money-dollar-circle-line' }
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  const handleSaveSettings = () => {
    alert('Paramètres enregistrés avec succès !');
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut du restaurant</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Restaurant ouvert</h4>
            <p className="text-sm text-gray-600">Contrôler l'acceptation des nouvelles commandes</p>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres des commandes</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Acceptation automatique</h4>
              <p className="text-sm text-gray-600">Accepter les commandes automatiquement sans intervention</p>
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
              Nombre max de commandes par heure
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
              Temps de préparation par défaut (minutes)
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
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Horaires d'ouverture</h3>
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
              <span className="text-sm text-gray-600">Ouvert</span>
            </div>

            {!settings.hours[day.key as keyof typeof settings.hours].closed && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">De :</label>
                  <input
                    type="time"
                    value={settings.hours[day.key as keyof typeof settings.hours].open}
                    onChange={(e) => updateHours(day.key, 'open', e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">À :</label>
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
              <span className="text-sm text-red-600 font-medium">Fermé</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotificationsSettings = () => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Paramètres des notifications</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Nouvelle commande</h4>
            <p className="text-sm text-gray-600">Notification à la réception d'une nouvelle commande</p>
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
            <h4 className="font-medium text-gray-900">Annulation de commande</h4>
            <p className="text-sm text-gray-600">Notification lors de l'annulation d'une commande</p>
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
            <h4 className="font-medium text-gray-900">Nouvel avis</h4>
            <p className="text-sm text-gray-600">Notification à la réception d'un avis client</p>
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
            <h4 className="font-medium text-gray-900">Rapport quotidien</h4>
            <p className="text-sm text-gray-600">Rapport quotidien des ventes et commandes</p>
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
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Moyens de paiement acceptés</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
            <div>
              <h4 className="font-medium text-gray-900">Paiement à la livraison</h4>
              <p className="text-sm text-gray-600">Accepter les paiements en espèces à la livraison</p>
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
              <h4 className="font-medium text-gray-900">Carte bancaire</h4>
              <p className="text-sm text-gray-600">Accepter les paiements par carte</p>
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
              <h4 className="font-medium text-gray-900">Portefeuille numérique</h4>
              <p className="text-sm text-gray-600">Accepter les paiements via portefeuilles numériques</p>
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
              <h4 className="font-medium text-gray-900">Virement bancaire</h4>
              <p className="text-sm text-gray-600">Accepter les paiements par virement</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
          <p className="text-gray-600">Gérez les paramètres et préférences de votre restaurant</p>
        </div>
        
        <button
          onClick={handleSaveSettings}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <i className="ri-save-line"></i>
          Enregistrer
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
