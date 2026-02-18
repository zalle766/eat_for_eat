interface RestaurantSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function RestaurantSidebar({ activeTab, setActiveTab, isOpen, onClose }: RestaurantSidebarProps) {
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
    <>
      {/* Overlay mobile — fermer le menu au clic */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 h-screen
          flex flex-col z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:sticky lg:top-0
        `}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="ri-restaurant-line text-white text-xl"></i>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Tableau de bord</h2>
              <p className="text-xs text-gray-500">Gérez votre restaurant</p>
            </div>
          </div>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto min-h-0">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full text-right px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                  }`}
                >
                  <i className={`${item.icon} text-xl flex-shrink-0`}></i>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Help Section */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <i className="ri-customer-service-2-line text-orange-600 flex-shrink-0"></i>
              <span className="text-sm font-semibold text-orange-800">Besoin d&apos;aide ?</span>
            </div>
            <p className="text-xs text-orange-700 mb-3">Équipe support disponible 24/7</p>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
              Contactez-nous
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
