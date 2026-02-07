
interface RestaurantSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function RestaurantSidebar({ activeTab, setActiveTab }: RestaurantSidebarProps) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'ri-dashboard-3-line'
    },
    {
      id: 'menu',
      label: 'Gestion du menu',
      icon: 'ri-restaurant-line'
    },
    {
      id: 'offers',
      label: 'Offres',
      icon: 'ri-coupon-line'
    },
    {
      id: 'orders',
      label: 'Commandes',
      icon: 'ri-shopping-bag-3-line'
    },
    {
      id: 'profile',
      label: 'Profil restaurant',
      icon: 'ri-store-2-line'
    },
    {
      id: 'analytics',
      label: 'Analytiques',
      icon: 'ri-line-chart-line'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: 'ri-settings-3-line'
    }
  ];

  return (
    <div className="w-64 bg-white border-l border-gray-200 h-screen">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
            <i className="ri-restaurant-line text-white text-xl"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Tableau de bord</h2>
            <p className="text-xs text-gray-500">Gérez votre restaurant</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-right px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  activeTab === item.id
                    ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <i className={`${item.icon} text-xl`}></i>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Help Section - Moved to bottom */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-3 mb-2">
            <i className="ri-customer-service-2-line text-orange-600"></i>
            <span className="text-sm font-semibold text-orange-800">Besoin d'aide ?</span>
          </div>
          <p className="text-xs text-orange-700 mb-3">Équipe support disponible 24/7</p>
          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
            Contactez-nous
          </button>
        </div>
      </div>
    </div>
  );
}
