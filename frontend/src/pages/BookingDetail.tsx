import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  accommodation: {
    id: string;
    name: string;
    type: string;
    maxGuests: number;
    basePrice: number;
  };
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  specialRequests?: string;
  status: string;
  totalAmount: number;
  source: string;
  jotformSubmissionId?: string;
  notes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    paymentType: string;
  }>;
}

const BookingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${id}`);
      setBooking(response.data.data.booking);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (action: string) => {
    try {
      await api.post(`/bookings/${id}/${action}`);
      fetchBooking();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Booking not found</p>
        <button
          onClick={() => navigate('/bookings')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  const totalPaid = booking.payments
    ?.filter(p => p.status === 'completed')
    ?.reduce((sum, p) => sum + p.amount, 0) || 0;

  const balance = booking.totalAmount - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Booking Details</h2>
          <p className="text-gray-500 mt-1">ID: {booking.id}</p>
        </div>
        <button
          onClick={() => navigate('/bookings')}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Bookings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guest Information */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Guest Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-800">{booking.guestName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{booking.guestEmail}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-800">{booking.guestPhone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Number of Guests</p>
              <p className="font-medium text-gray-800">{booking.numberOfGuests}</p>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Accommodation</p>
              <p className="font-medium text-gray-800">{booking.accommodation.name}</p>
              <p className="text-sm text-gray-400 capitalize">{booking.accommodation.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Check-in Date</p>
              <p className="font-medium text-gray-800">{format(new Date(booking.checkInDate), 'MMMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Check-out Date</p>
              <p className="font-medium text-gray-800">{format(new Date(booking.checkOutDate), 'MMMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Source</p>
              <p className="font-medium text-gray-800 capitalize">{booking.source.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <p className="text-gray-500">Total Amount</p>
              <p className="font-semibold text-gray-800">${booking.totalAmount.toLocaleString()}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-500">Total Paid</p>
              <p className="font-semibold text-green-600">${totalPaid.toLocaleString()}</p>
            </div>
            <div className="flex justify-between border-t pt-3">
              <p className="text-gray-500">Balance</p>
              <p className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${balance.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/payments?bookingId=${booking.id}`)}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Payments
          </button>
        </div>

        {/* Status & Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status & Actions</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Current Status</p>
              <span className={`status-badge status-${booking.status} text-sm`}>
                {booking.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusChange('confirm')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancel')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel Booking
                  </button>
                </>
              )}
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusChange('checkin')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Check In
                </button>
              )}
              {booking.status === 'checked_in' && (
                <button
                  onClick={() => handleStatusChange('checkout')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Check Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {booking.specialRequests && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Special Requests</h3>
          <p className="text-gray-700">{booking.specialRequests}</p>
        </div>
      )}

      {booking.notes && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes</h3>
          <p className="text-gray-700">{booking.notes}</p>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;