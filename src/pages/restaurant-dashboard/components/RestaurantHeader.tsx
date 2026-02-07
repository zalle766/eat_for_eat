
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface RestaurantHeaderProps {
  restaurant: any;
}

export default function RestaurantHeader({ restaurant }: RestaurantHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 overflow-visible">
      <div className="flex items-center justify-between overflow-visible">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord restaurant</h1>
          <p className="text-sm text-gray-600">Gestion complète de votre restaurant</p>
        </div>

        <div className="flex items-center gap-4">
          {/* إشعارات */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <i className="ri-notification-3-line text-xl"></i>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* معلومات المطعم */}
          <div className="flex items-center gap-3">
            <img 
              src={restaurant.image || restaurant.image_url || 'https://readdy.ai/api/search-image?query=modern%20restaurant%20interior%20with%20warm%20lighting%20and%20elegant%20dining%20tables%2C%20professional%20food%20photography%20style%2C%20clean%20and%20inviting%20atmosphere&width=40&height=40&seq=restaurant-avatar&orientation=squarish'}
              alt={restaurant.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{restaurant.name}</p>
              <p className="text-xs text-gray-500">{restaurant.cuisine_type}</p>
            </div>
          </div>

          {/* Menu utilisateur */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-more-2-line text-xl"></i>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100] min-w-[12rem]">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/');
                  }}
                  className="w-full text-right px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-home-line"></i>
                  Retour au site
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    handleLogout();
                  }}
                  className="w-full text-right px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-logout-circle-line"></i>
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
