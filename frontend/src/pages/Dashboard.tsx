import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  checkedInToday: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  occupancyRate: number;
  totalAccommodations: number;
  occupiedAccommodations: number;
}

interface Booking {
  id: string;
  guestName: string;
  accommodation: {
    name: string;
  };
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  status: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingCheckIns, setUpcomingCheckIns] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setStats(response.data.data.stats);
      setUpcomingCheckIns(response.data.data.upcomingCheckIns);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <Link
          to="/bookings/new"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + New Booking
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon="📊"
          color="blue"
        />
        <StatCard
          title="Pending"
          value={stats?.pendingBookings || 0}
          icon="⏳"
          color="yellow"
        />
        <StatCard
          title="Confirmed"
          value={stats?.confirmedBookings || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Checked In Today"
          value={stats?.checkedInToday || 0}
          icon="🚪"
          color="purple"
        />
      </div>

      {/* Revenue & Occupancy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Monthly Revenue</p>
          <p className="text-3xl font-bold text-gray-800">
            ${stats?.monthlyRevenue?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Yearly Revenue</p>
          <p className="text-3xl font-bold text-gray-800">
            ${stats?.yearlyRevenue?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Occupancy Rate</p>
          <p className="text-3xl font-bold text-gray-800">
            {stats?.occupancyRate || 0}%
          </p>
          <p className="text-sm text-gray-400">
            {stats?.occupiedAccommodations} / {stats?.totalAccommodations} units
          </p>
        </div>
      </div>

      {/* Upcoming Check-ins */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Upcoming Check-ins (Next 7 Days)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accommodation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {upcomingCheckIns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No upcoming check-ins
                  </td>
                </tr>
              ) : (
                upcomingCheckIns.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/bookings/${booking.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                        {booking.guestName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {booking.accommodation?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {format(new Date(booking.checkInDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {booking.numberOfGuests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;