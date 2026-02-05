import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Accommodation {
  id: string;
  name: string;
  description: string;
  type: string;
  maxGuests: number;
  basePrice: number;
  amenities: string[];
  isActive: boolean;
}

const Accommodations: React.FC = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Accommodation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'villa',
    maxGuests: 1,
    basePrice: 0,
    amenities: ''
  });

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const fetchAccommodations = async () => {
    try {
      const response = await api.get('/accommodations');
      setAccommodations(response.data.data.accommodations);
    } catch (error) {
      console.error('Error fetching accommodations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean)
      };

      if (editing) {
        await api.put(`/accommodations/${editing.id}`, data);
      } else {
        await api.post('/accommodations', data);
      }
      
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', description: '', type: 'villa', maxGuests: 1, basePrice: 0, amenities: '' });
      fetchAccommodations();
    } catch (error) {
      console.error('Error saving accommodation:', error);
      alert('Failed to save accommodation');
    }
  };

  const handleEdit = (acc: Accommodation) => {
    setEditing(acc);
    setFormData({
      name: acc.name,
      description: acc.description,
      type: acc.type,
      maxGuests: acc.maxGuests,
      basePrice: acc.basePrice,
      amenities: acc.amenities.join(', ')
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this accommodation?')) return;
    try {
      await api.delete(`/accommodations/${id}`);
      fetchAccommodations();
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      alert('Failed to delete accommodation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Accommodations</h2>
        <button
          onClick={() => {
            setEditing(null);
            setFormData({ name: '', description: '', type: 'villa', maxGuests: 1, basePrice: 0, amenities: '' });
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          + Add Accommodation
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editing ? 'Edit Accommodation' : 'Add New Accommodation'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <select
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="villa">Villa</option>
              <option value="suite">Suite</option>
              <option value="room">Room</option>
              <option value="bungalow">Bungalow</option>
            </select>
            <input
              type="number"
              placeholder="Max Guests"
              value={formData.maxGuests}
              onChange={e => setFormData({...formData, maxGuests: parseInt(e.target.value)})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              min="1"
              required
            />
            <input
              type="number"
              placeholder="Base Price"
              value={formData.basePrice}
              onChange={e => setFormData({...formData, basePrice: parseFloat(e.target.value)})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              min="0"
              step="0.01"
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none md:col-span-2"
              rows={3}
            />
            <input
              type="text"
              placeholder="Amenities (comma separated)"
              value={formData.amenities}
              onChange={e => setFormData({...formData, amenities: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none md:col-span-2"
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                {editing ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accommodations.map(acc => (
          <div key={acc.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{acc.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{acc.type}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(acc)} className="text-blue-600 hover:text-blue-800">✏️</button>
                <button onClick={() => handleDelete(acc.id)} className="text-red-600 hover:text-red-800">🗑️</button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{acc.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Max Guests</p>
                <p className="font-medium">{acc.maxGuests}</p>
              </div>
              <div>
                <p className="text-gray-500">Base Price</p>
                <p className="font-medium">${acc.basePrice}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-500 text-sm mb-2">Amenities:</p>
              <div className="flex flex-wrap gap-2">
                {acc.amenities.map((amenity, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accommodations;