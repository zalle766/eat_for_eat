
interface DriverSidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function DriverSidebar({ currentView, setCurrentView }: DriverSidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'لوحة المعلومات', icon: 'ri-dashboard-line' },
    { id: 'available-orders', label: 'الطلبات المتاحة', icon: 'ri-shopping-bag-line' },
    { id: 'my-deliveries', label: 'توصيلاتي', icon: 'ri-truck-line' },
    { id: 'earnings', label: 'الأرباح', icon: 'ri-money-dollar-circle-line' },
    { id: 'profile', label: 'الملف الشخصي', icon: 'ri-user-line' }
  ];

  return (
    <aside className="fixed right-0 top-16 bottom-0 w-64 bg-white border-l border-gray-200 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  currentView === item.id
                    ? 'bg-orange-50 text-orange-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className={`${item.icon} text-xl`}></i>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Help Section */}
      <div className="p-4 mt-auto border-t border-gray-200">
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-customer-service-2-line text-orange-600 text-xl"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">تحتاج مساعدة؟</h3>
              <p className="text-sm text-gray-600 mb-3">فريق الدعم متاح لمساعدتك</p>
              <button className="text-sm text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap">
                تواصل معنا
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
