interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
}

export default function AdminSidebar({ activeTab, onTabChange, isOpen }: AdminSidebarProps) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de Bord',
      icon: 'ri-dashboard-line',
      description: 'Vue d\'ensemble des statistiques'
    },
    {
      id: 'restaurants',
      label: 'Gestion Restaurants',
      icon: 'ri-restaurant-line',
      description: 'Gérer les restaurants et approbations'
    },
    {
      id: 'products',
      label: 'Gestion Produits',
      icon: 'ri-shopping-bag-line',
      description: 'Gérer les produits et prix'
    },
    {
      id: 'orders',
      label: 'Gestion Commandes',
      icon: 'ri-file-list-line',
      description: 'Suivre et gérer les commandes'
    },
    {
      id: 'users',
      label: 'Gestion Utilisateurs',
      icon: 'ri-user-line',
      description: 'Gérer les comptes clients'
    },
    {
      id: 'drivers',
      label: 'Gestion Livreurs',
      icon: 'ri-truck-line',
      description: 'Gérer les livreurs'
    },
    {
      id: 'analytics',
      label: 'Analyses et Rapports',
      icon: 'ri-bar-chart-line',
      description: 'Rapports détaillés et statistiques'
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => {}}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg border-r border-gray-200 z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:sticky lg:top-16
      `}>
        <div className="p-6">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full text-left p-4 rounded-lg transition-all duration-200 cursor-pointer
                  ${activeTab === item.id 
                    ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-orange-600'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <i className={`${item.icon} text-xl`}></i>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Quick Stats */}
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Statistiques Rapides</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Restaurants Actifs</span>
              <span className="text-sm font-medium text-green-600">24</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Commandes du Jour</span>
              <span className="text-sm font-medium text-blue-600">156</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Nouveaux Utilisateurs</span>
              <span className="text-sm font-medium text-purple-600">12</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}