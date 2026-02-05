import User from './User.model';
import Accommodation from './Accommodation.model';
import Booking from './Booking.model';
import Payment from './Payment.model';

// Define relationships
Accommodation.hasMany(Booking, {
  foreignKey: 'accommodationId',
  as: 'bookings'
});

Booking.belongsTo(Accommodation, {
  foreignKey: 'accommodationId',
  as: 'accommodation'
});

Booking.hasMany(Payment, {
  foreignKey: 'bookingId',
  as: 'payments'
});

Payment.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

User.hasMany(Booking, {
  foreignKey: 'createdBy',
  as: 'createdBookings'
});

Booking.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

User.hasMany(Payment, {
  foreignKey: 'processedBy',
  as: 'processedPayments'
});

Payment.belongsTo(User, {
  foreignKey: 'processedBy',
  as: 'processor'
});

export {
  User,
  Accommodation,
  Booking,
  Payment
};