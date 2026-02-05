
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface EarningsProps {
  driver: any;
}

export default function Earnings({ driver }: EarningsProps) {
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, [driver]);

  const loadEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('driver_id', driver.id)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const todayEarnings = data
          .filter(d => new Date(d.delivered_at) >= today)
          .reduce((sum, d) => sum + (d.driver_earnings || 0), 0);

        const weekEarnings = data
          .filter(d => new Date(d.delivered_at) >= weekAgo)
          .reduce((sum, d) => sum + (d.driver_earnings || 0), 0);

        const monthEarnings = data
          .filter(d => new Date(d.delivered_at) >= monthAgo)
          .reduce((sum, d) => sum + (d.driver_earnings || 0), 0);

        const totalEarnings = data.reduce((sum, d) => sum + (d.driver_earnings || 0), 0);

        setEarnings({
          today: todayEarnings,
          week: weekEarnings,
          month: monthEarnings,
          total: totalEarnings
        });

        setDeliveries(data);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('خطأ في تحميل الأرباح:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الأرباح...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">الأرباح</h2>
        <p className="text-gray-600">تتبع أرباحك من التوصيلات</p>
      </div>

      {/* Earnings Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-line text-2xl"></i>
            </div>
            <span className="text-sm opacity-90">اليوم</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{earnings.today.toFixed(2)} د.م</h3>
          <p className="text-sm opacity-90">أرباح اليوم</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-week-line text-2xl"></i>
            </div>
            <span className="text-sm opacity-90">هذا الأسبوع</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{earnings.week.toFixed(2)} د.م</h3>
          <p className="text-sm opacity-90">أرباح الأسبوع</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-month-line text-2xl"></i>
            </div>
            <span className="text-sm opacity-90">هذا الشهر</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{earnings.month.toFixed(2)} د.م</h3>
          <p className="text-sm opacity-90">أرباح الشهر</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-2xl"></i>
            </div>
            <span className="text-sm opacity-90">الإجمالي</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{earnings.total.toFixed(2)} د.م</h3>
          <p className="text-sm opacity-90">إجمالي الأرباح</p>
        </div>
      </div>

      {/* Earnings History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">سجل الأرباح</h3>
        </div>

        {deliveries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-money-dollar-circle-line text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد أرباح بعد</h3>
            <p className="text-gray-600">ابدأ بقبول الطلبات لتحقيق أرباحك الأولى</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الطلب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ الكلي</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رسوم التوصيل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">أرباحك</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">#{delivery.order_id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {new Date(delivery.delivered_at).toLocaleDateString('ar-MA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{delivery.customer_name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{delivery.total_amount.toFixed(2)} د.م</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{delivery.delivery_fee.toFixed(2)} د.م</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">{delivery.driver_earnings.toFixed(2)} د.م</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
