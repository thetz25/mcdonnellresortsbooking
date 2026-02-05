import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  paymentType: string;
  status: string;
  transactionId?: string;
  paymentDate: string;
  notes?: string;
  booking?: {
    guestName: string;
    guestEmail: string;
  };
}

interface Booking {
  id: string;
  guestName: string;
  totalAmount: number;
}

const Payments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bookingId: searchParams.get('bookingId') || '',
    amount: '',
    paymentMethod: 'cash',
    paymentType: 'deposit',
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, bookingsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/bookings')
      ]);
      setPayments(paymentsRes.data.data.payments);
      setBookings(bookingsRes.data.data.bookings.map((b: any) => ({
        id: b.id,
        guestName: b.guestName,
        totalAmount: b.totalAmount
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/payments', {
        ...formData,
        amount: parseFloat(formData.amount),
        paymentDate: new Date().toISOString()
      });
      setShowForm(false);
      setFormData({ bookingId: '', amount: '', paymentMethod: 'cash', paymentType: 'deposit', transactionId: '', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment');
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
        <h2 className="text-3xl font-bold text-gray-800">Payments</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          + Record Payment
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Record New Payment</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={formData.bookingId}
              onChange={e => setFormData({...formData, bookingId: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Select Booking</option>
              {bookings.map(booking => (
                <option key={booking.id} value={booking.id}>
                  {booking.guestName} - ${booking.totalAmount}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              step="0.01"
              min="0"
              required
            />
            <select
              value={formData.paymentMethod}
              onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="other">Other</option>
            </select>
            <select
              value={formData.paymentType}
              onChange={e => setFormData({...formData, paymentType: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="deposit">Deposit</option>
              <option value="full_payment">Full Payment</option>
              <option value="partial_payment">Partial Payment</option>
              <option value="refund">Refund</option>
            </select>
            <input
              type="text"
              placeholder="Transaction ID (optional)"
              value={formData.transactionId}
              onChange={e => setFormData({...formData, transactionId: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Record Payment
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No payments recorded</td>
              </tr>
            ) : (
              payments.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{payment.booking?.guestName}</p>
                    <p className="text-sm text-gray-500">{payment.booking?.guestEmail}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">${payment.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-700 capitalize">{payment.paymentMethod.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-gray-700 capitalize">{payment.paymentType.replace('_', ' ')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'refunded' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;