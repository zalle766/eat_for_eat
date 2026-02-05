
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [categories, setCategories] = useState<string[]>(['all']);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('cuisine_type');

      if (error) throw error;
      
      const uniqueCategories = ['all', ...new Set(data?.map(item => item.cuisine_type) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'all': 'ri-restaurant-line',
      'Français': 'ri-wine-glass-line',
      'Italien': 'ri-restaurant-2-line',
      'Japonais': 'ri-bowl-line',
      'Chinois': 'ri-bowl-line',
      'Indien': 'ri-leaf-line',
      'Mexicain': 'ri-cake-3-line',
      'Burger': 'ri-cake-3-line',
      'Pizza': 'ri-cake-2-line',
      'Fruits de mer': 'ri-fish-line',
      'Végétarien': 'ri-leaf-line',
      'Traditionnel': 'ri-home-heart-line'
    };
    return icons[category] || 'ri-restaurant-line';
  };

  const getCategoryName = (category: string) => {
    return category === 'all' ? 'Tout' : category;
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === category
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
          }`}
        >
          <i className={`${getCategoryIcon(category)} text-lg`}></i>
          <span className="font-medium">{getCategoryName(category)}</span>
        </button>
      ))}
    </div>
  );
}
