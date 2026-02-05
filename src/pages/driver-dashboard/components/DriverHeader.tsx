
import { supabase } from '../../../lib/supabase';

interface DriverHeaderProps {
  driver: any;
}

export default function DriverHeader({ driver }: DriverHeaderProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.REACT_APP_NAVIGATE('/driver-login');
  };

  const toggleAvailability = async () => {
    try {
      const newStatus = !driver.is_available;
      const { error } = await supabase
        .from('drivers')
        .update({ is_available: newStatus })
        .eq('id', driver.id);

      if (error) {
        console.error('خطأ في تحديث الحالة:', error);
        alert('حدث خطأ في تحديث حالة التوفر. تحقق من الاتصال أو من صلاحيات قاعدة البيانات.');
        return;
      }

      // تحديث الحالة محلياً بدون إعادة تحميل كاملة
      driver.is_available = newStatus;
      window.location.reload();
    } catch (error) {
      console.error('خطأ في تحديث الحالة:', error);
      alert('حدث خطأ غير متوقع أثناء تحديث حالة التوفر.');
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 bg-white border-b border-gray-200 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <i className="ri-truck-line text-xl text-white"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">لوحة تحكم السائق</h1>
              <p className="text-sm text-gray-600">مرحباً، {driver.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Availability Toggle */}
            <button
              onClick={toggleAvailability}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                driver.is_available
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${driver.is_available ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              {driver.is_available ? 'متاح للتوصيل' : 'غير متاح'}
            </button>

            {/* Rating */}
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
              <i className="ri-star-fill text-yellow-500"></i>
              <span className="font-semibold text-gray-900">{driver.rating.toFixed(1)}</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-logout-box-line"></i>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
