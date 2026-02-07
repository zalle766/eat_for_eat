
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  license_plate: string;
  national_id: string;
  driving_license: string;
  city: string;
  status: string;
  is_available: boolean;
  rating: number;
  total_deliveries: number;
  completed_deliveries: number;
  total_earnings: number;
  created_at: string;
}

export default function DriversManagement() {
  const toast = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('خطأ في تحميل السائقين:', error);
      setIsLoading(false);
    }
  };

  const updateDriverStatus = async (driverId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: newStatus })
        .eq('id', driverId);

      if (error) throw error;

      setDrivers(drivers.map(driver => 
        driver.id === driverId ? { ...driver, status: newStatus } : driver
      ));

      toast.success('تم تحديث حالة السائق بنجاح');
    } catch (error) {
      console.error('خطأ في التحديث:', error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const deleteDriver = async (driverId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السائق؟')) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) throw error;

      setDrivers(drivers.filter(driver => driver.id !== driverId));
      toast.success('تم حذف السائق بنجاح');
    } catch (error) {
      console.error('خطأ في الحذف:', error);
      toast.error('حدث خطأ أثناء حذف السائق');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700' },
      approved: { label: 'مقبول', color: 'bg-green-100 text-green-700' },
      rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700' }
    };
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone?.includes(searchTerm) ||
                         driver.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.license_plate?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || driver.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalDrivers = drivers.length;
  const approvedDrivers = drivers.filter(d => d.status === 'approved').length;
  const pendingDrivers = drivers.filter(d => d.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إدارة السائقين</h1>
        <p className="text-gray-600">إدارة جميع سائقي التوصيل في المنصة</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-truck-line text-2xl text-blue-600"></i>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي السائقين</p>
              <p className="text-2xl font-bold text-gray-900">{totalDrivers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">السائقون المقبولون</p>
              <p className="text-2xl font-bold text-gray-900">{approvedDrivers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-2xl text-yellow-600"></i>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">قيد المراجعة</p>
              <p className="text-2xl font-bold text-gray-900">{pendingDrivers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البحث
            </label>
            <div className="relative">
              <i className="ri-search-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="ابحث بالاسم، الهاتف، المدينة..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحالة
            </label>
            <select
              className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">جميع الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">مقبول</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  السائق
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  التواصل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المركبة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المدينة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  التقييم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  التوصيلات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{driver.name?.charAt(0)}</span>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                        <div className="text-sm text-gray-500">
                          {driver.is_available ? (
                            <span className="text-green-600">متاح</span>
                          ) : (
                            <span className="text-gray-500">غير متاح</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.phone}</div>
                    <div className="text-sm text-gray-500">{driver.national_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {driver.vehicle_type === 'motorcycle' && 'دراجة نارية'}
                      {driver.vehicle_type === 'car' && 'سيارة'}
                      {driver.vehicle_type === 'bicycle' && 'دراجة هوائية'}
                    </div>
                    <div className="text-sm text-gray-500">{driver.license_plate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {driver.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <i className="ri-star-fill text-yellow-500"></i>
                      <span className="text-sm font-medium text-gray-900">{driver.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.completed_deliveries || 0} مكتملة</div>
                    <div className="text-sm text-gray-500">من {driver.total_deliveries || 0} إجمالي</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(driver.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {driver.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateDriverStatus(driver.id, 'approved')}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 cursor-pointer whitespace-nowrap"
                          >
                            قبول
                          </button>
                          <button
                            onClick={() => updateDriverStatus(driver.id, 'rejected')}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 cursor-pointer whitespace-nowrap"
                          >
                            رفض
                          </button>
                        </>
                      )}
                      {driver.status === 'approved' && (
                        <button
                          onClick={() => updateDriverStatus(driver.id, 'rejected')}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 cursor-pointer whitespace-nowrap"
                        >
                          إيقاف
                        </button>
                      )}
                      {driver.status === 'rejected' && (
                        <button
                          onClick={() => updateDriverStatus(driver.id, 'approved')}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 cursor-pointer whitespace-nowrap"
                        >
                          تفعيل
                        </button>
                      )}
                      <button
                        onClick={() => deleteDriver(driver.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 cursor-pointer whitespace-nowrap"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDrivers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-truck-line text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد سائقون</h3>
            <p className="text-gray-500">لم يتم العثور على سائقين يطابقون معايير البحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
