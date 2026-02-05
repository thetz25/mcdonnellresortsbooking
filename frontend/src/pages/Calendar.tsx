import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../services/api';
import { format, isWithinInterval, parseISO } from 'date-fns';

interface Booking {
  id: string;
  guestName: string;
  accommodation: {
    id: string;
    name: string;
    type: string;
  };
  checkInDate: string;
  checkOutDate: string;
  status: string;
}

interface Accommodation {
  id: string;
  name: string;
  type: string;
}

const CalendarPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, accommodationsRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/accommodations')
      ]);
      setBookings(bookingsRes.data.data.bookings.filter((b: Booking) => b.status !== 'cancelled'));
      setAccommodations(accommodationsRes.data.data.accommodations);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = parseISO(booking.checkInDate);
      const checkOut = parseISO(booking.checkOutDate);
      return isWithinInterval(date, { start: checkIn, end: checkOut }) &&
        (!selectedAccommodation || booking.accommodation.id === selectedAccommodation);
    });
  };

  const getDayClassName = ({ date }: { date: Date }) => {
    const dayBookings = getBookingsForDate(date);
    if (dayBookings.length === 0) return '';
    return 'bg-blue-100';
  };

  const selectedDateBookings = getBookingsForDate(selectedDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Availability Calendar</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Accommodation
            </label>
            <select
              value={selectedAccommodation}
              onChange={(e) => setSelectedAccommodation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Accommodations</option>
              {accommodations.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span>Has Bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span>Selected Date</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <Calendar
              onChange={(value) => setSelectedDate(value as Date)}
              value={selectedDate}
              tileClassName={getDayClassName}
              className="w-full border-none"
            />
          </div>
        </div>
      </div>

      {/* Selected Date Bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            Bookings for {format(selectedDate, 'MMMM dd, yyyy')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accommodation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {selectedDateBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No bookings for this date
                  </td>
                </tr>
              ) : (
                selectedDateBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{booking.guestName}</td>
                    <td className="px-6 py-4 text-gray-700">{booking.accommodation.name}</td>
                    <td className="px-6 py-4 text-gray-700">{format(parseISO(booking.checkInDate), 'MMM dd')}</td>
                    <td className="px-6 py-4 text-gray-700">{format(parseISO(booking.checkOutDate), 'MMM dd')}</td>
                    <td className="px-6 py-4">
                      <span className={`status-badge status-${booking.status}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;