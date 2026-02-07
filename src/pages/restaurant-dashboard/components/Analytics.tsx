
import { useState, useEffect } from 'react';

interface AnalyticsProps {
  restaurant: any;
}

export default function Analytics({ restaurant }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState('week');
  const [analytics, setAnalytics] = useState({
    revenue: {
      total: 15600,
      growth: 12.5,
      data: [
        { date: '2024-01-01', amount: 1200 },
        { date: '2024-01-02', amount: 1800 },
        { date: '2024-01-03', amount: 2200 },
        { date: '2024-01-04', amount: 1600 },
        { date: '2024-01-05', amount: 2400 },
        { date: '2024-01-06', amount: 3200 },
        { date: '2024-01-07', amount: 3200 }
      ]
    },
    orders: {
      total: 156,
      growth: 8.3,
      data: [
        { date: '2024-01-01', count: 12 },
        { date: '2024-01-02', count: 18 },
        { date: '2024-01-03', count: 22 },
        { date: '2024-01-04', count: 16 },
        { date: '2024-01-05', count: 24 },
        { date: '2024-01-06', count: 32 },
        { date: '2024-01-07', count: 32 }
      ]
    },
    topProducts: [
      { name: 'برجر كلاسيك', orders: 45, revenue: 2025 },
      { name: 'بيتزا مارجريتا', orders: 32, revenue: 2080 },
      { name: 'سلطة قيصر', orders: 28, revenue: 980 },
      { name: 'بطاطس مقلية', orders: 56, revenue: 840 },
      { name: 'كوكا كولا', orders: 78, revenue: 624 }
    ],
    customerStats: {
      newCustomers: 23,
      returningCustomers: 67,
      averageOrderValue: 85.5
    },
    peakHours: [
      { hour: '12:00', orders: 15 },
      { hour: '13:00', orders: 22 },
      { hour: '14:00', orders: 18 },
      { hour: '19:00', orders: 25 },
      { hour: '20:00', orders: 28 },
      { hour: '21:00', orders: 20 }
    ]
  });

  const timeRanges = [
    { value: 'week', label: 'هذا الأسبوع' },
    { value: 'month', label: 'هذا الشهر' },
    { value: 'quarter', label: 'هذا الربع' },
    { value: 'year', label: 'هذا العام' }
  ];

  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">التحليلات والتقارير</h2>
          <p className="text-gray-600">تتبع أداء مطعمك وإحصائيات المبيعات</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <i className="ri-download-line"></i>
            تصدير التقرير
          </button>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              analytics.revenue.growth > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {analytics.revenue.growth > 0 ? '+' : ''}{analytics.revenue.growth}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">إجمالي الإيرادات</h3>
          <p className="text-3xl font-bold text-gray-900">{analytics.revenue.total.toLocaleString()} dh</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-bag-3-line text-2xl text-blue-600"></i>
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              analytics.orders.growth > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {analytics.orders.growth > 0 ? '+' : ''}{analytics.orders.growth}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">إجمالي الطلبات</h3>
          <p className="text-3xl font-bold text-gray-900">{analytics.orders.total}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-user-add-line text-2xl text-purple-600"></i>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">عملاء جدد</h3>
          <p className="text-3xl font-bold text-gray-900">{analytics.customerStats.newCustomers}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-calculator-line text-2xl text-orange-600"></i>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">متوسط قيمة الطلب</h3>
          <p className="text-3xl font-bold text-gray-900">{analytics.customerStats.averageOrderValue} dh</p>
        </div>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* رسم بياني للإيرادات */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">الإيرادات اليومية</h3>
          <div className="space-y-4">
            {analytics.revenue.data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                </span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(item.amount / Math.max(...analytics.revenue.data.map(d => d.amount))) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.amount} dh</span>
              </div>
            ))}
          </div>
        </div>

        {/* رسم بياني للطلبات */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">الطلبات اليومية</h3>
          <div className="space-y-4">
            {analytics.orders.data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                </span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(item.count / Math.max(...analytics.orders.data.map(d => d.count))) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.count} طلب</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* المنتجات الأكثر مبيعاً */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">المنتجات الأكثر مبيعاً</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analytics.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.orders} طلب</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-gray-900">{product.revenue} dh</p>
                  <p className="text-sm text-gray-500">إجمالي الإيرادات</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ساعات الذروة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">ساعات الذروة</h3>
          <div className="space-y-4">
            {analytics.peakHours.map((hour, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{hour.hour}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${(hour.orders / Math.max(...analytics.peakHours.map(h => h.orders))) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{hour.orders} طلب</span>
              </div>
            ))}
          </div>
        </div>

        {/* إحصائيات العملاء */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">إحصائيات العملاء</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">عملاء جدد</p>
                <p className="text-2xl font-bold text-green-600">{analytics.customerStats.newCustomers}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <i className="ri-user-add-line text-2xl text-green-600"></i>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">عملاء عائدون</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.customerStats.returningCustomers}</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-user-heart-line text-2xl text-blue-600"></i>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">نسبة العملاء العائدين</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round((analytics.customerStats.returningCustomers / (analytics.customerStats.newCustomers + analytics.customerStats.returningCustomers)) * 100)}%
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ 
                    width: `${(analytics.customerStats.returningCustomers / (analytics.customerStats.newCustomers + analytics.customerStats.returningCustomers)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* تقارير سريعة */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">تقارير سريعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-center">
            <i className="ri-file-chart-line text-2xl text-blue-600 mb-2"></i>
            <p className="text-sm font-medium text-blue-800">تقرير المبيعات</p>
          </button>
          
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors text-center">
            <i className="ri-pie-chart-line text-2xl text-green-600 mb-2"></i>
            <p className="text-sm font-medium text-green-800">تقرير المنتجات</p>
          </button>
          
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors text-center">
            <i className="ri-user-line text-2xl text-purple-600 mb-2"></i>
            <p className="text-sm font-medium text-purple-800">تقرير العملاء</p>
          </button>
          
          <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors text-center">
            <i className="ri-time-line text-2xl text-orange-600 mb-2"></i>
            <p className="text-sm font-medium text-orange-800">تقرير الأوقات</p>
          </button>
        </div>
      </div>
    </div>
  );
}
