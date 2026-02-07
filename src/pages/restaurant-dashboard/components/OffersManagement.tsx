import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

interface Offer {
  id: string;
  restaurant_id: string;
  title: string;
  description: string;
  discount: string;
  code: string;
  valid_until: string;
  image_url: string;
  min_order: number;
  is_active: boolean;
  created_at: string;
}

interface OffersManagementProps {
  restaurant: any;
}

export default function OffersManagement({ restaurant }: OffersManagementProps) {
  const toast = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    code: '',
    valid_until: '',
    image_url: '',
    min_order: '0',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadOffers();
  }, [restaurant.id]);

  const loadOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Erreur chargement offres:', error);
      toast.error('Erreur lors du chargement des offres');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingOffer(null);
    setFormData({
      title: '',
      description: '',
      discount: '',
      code: '',
      valid_until: '',
      image_url: '',
      min_order: '0',
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      discount: offer.discount,
      code: offer.code,
      valid_until: offer.valid_until ? offer.valid_until.slice(0, 10) : '',
      image_url: offer.image_url || '',
      min_order: offer.min_order?.toString() || '0',
    });
    setImageFile(null);
    setImagePreview(offer.image_url || null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.warning('Veuillez choisir une image (JPG, PNG, etc.)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('La taille ne doit pas dépasser 5 Mo');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, image_url: '' }));
    }
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `offers/${restaurant.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage
      .from('restaurant-images')
      .upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-images')
      .getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let imageUrl = formData.image_url.trim() || null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        restaurant_id: restaurant.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        discount: formData.discount.trim(),
        code: formData.code.trim().toUpperCase(),
        valid_until: formData.valid_until || null,
        image_url: imageUrl,
        min_order: parseFloat(formData.min_order) || 0,
      };

      if (editingOffer) {
        const { error } = await supabase
          .from('offers')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingOffer.id);
        if (error) throw error;
        toast.success('Offre mise à jour avec succès');
      } else {
        const { error } = await supabase.from('offers').insert([payload]);
        if (error) throw error;
        toast.success('Offre ajoutée avec succès');
      }
      setShowModal(false);
      loadOffers();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette offre ?')) return;
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
      toast.success('Offre supprimée');
      loadOffers();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleActive = async (offer: Offer) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_active: !offer.is_active, updated_at: new Date().toISOString() })
        .eq('id', offer.id);
      if (error) throw error;
      toast.success(offer.is_active ? 'Offre désactivée' : 'Offre activée');
      loadOffers();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des offres</h2>
          <p className="text-gray-600">Créez et gérez les offres promotionnelles de votre restaurant</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
        >
          <i className="ri-add-line"></i>
          Ajouter une offre
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-coupon-line text-4xl text-orange-500"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune offre pour le moment</h3>
          <p className="text-gray-600 mb-6">Ajoutez des offres pour attirer plus de clients</p>
          <button
            onClick={openAddModal}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer"
          >
            Ajouter une offre
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`bg-white rounded-xl border overflow-hidden ${!offer.is_active ? 'opacity-60' : ''}`}
            >
              <div className="relative h-40 bg-gray-100">
                {offer.image_url ? (
                  <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                    <i className="ri-coupon-line text-6xl text-orange-400"></i>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                  {offer.discount}
                </div>
                {!offer.is_active && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-gray-700 text-white px-4 py-2 rounded-lg font-medium">Inactive</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1">{offer.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{offer.description}</p>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="font-mono font-bold text-orange-600">{offer.code}</span>
                  <span className="text-gray-500">
                    Min: {offer.min_order > 0 ? `${offer.min_order} DH` : 'Aucun'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(offer)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                      offer.is_active ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {offer.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => openEditModal(offer)}
                    className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 cursor-pointer"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 cursor-pointer"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">
                {editingOffer ? 'Modifier l\'offre' : 'Nouvelle offre'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Ex: 50% de réduction"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Décrivez l'offre..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Réduction *</label>
                  <input
                    type="text"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Ex: 50%, Livraison gratuite"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-4 py-2 border rounded-lg font-mono"
                    placeholder="Ex: BONUS50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum commande (DH)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_order}
                    onChange={(e) => setFormData({ ...formData, min_order: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valable jusqu'au</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image de l'offre</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    {(imagePreview || formData.image_url) ? (
                      <div className="relative">
                        <img
                          src={imagePreview || formData.image_url}
                          alt="Aperçu"
                          className="w-full h-40 object-cover rounded-lg border"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/90 text-gray-700 p-2 rounded-full hover:bg-white cursor-pointer shadow"
                            title="Changer l'image"
                          >
                            <i className="ri-upload-line"></i>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 cursor-pointer"
                            title="Supprimer"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer"
                      >
                        <i className="ri-upload-cloud-line text-4xl text-gray-400"></i>
                        <span className="text-sm text-gray-600">Cliquez pour télécharger une image</span>
                        <span className="text-xs text-gray-400">JPG, PNG - max 5 Mo</span>
                      </button>
                    )}
                    {!imagePreview && !formData.image_url && (
                      <p className="text-xs text-gray-500 mt-1">Ou collez une URL ci-dessous</p>
                    )}
                  </div>
                  <div className="sm:w-48">
                    <label className="block text-xs text-gray-500 mb-1">URL (optionnel)</label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        if (e.target.value) setImageFile(null);
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Envoi en cours...' : (editingOffer ? 'Enregistrer' : 'Ajouter')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
