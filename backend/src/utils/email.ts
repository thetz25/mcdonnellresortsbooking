import nodemailer from 'nodemailer';
import { Booking, Accommodation } from '../models';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export interface BookingEmailData {
  guestName: string;
  guestEmail: string;
  accommodationName: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalAmount: number;
  specialRequests?: string;
  status: string;
}

export const sendNewBookingNotification = async (bookingData: BookingEmailData): Promise<void> => {
  const adminEmail = process.env.EMAIL_FROM;
  
  if (!adminEmail) {
    console.warn('Admin email not configured. Skipping notification.');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: adminEmail,
    subject: `🎉 New Booking Received - ${bookingData.guestName}`,
    html: `
      <h2>New Booking Notification</h2>
      <p><strong>Guest Name:</strong> ${bookingData.guestName}</p>
      <p><strong>Guest Email:</strong> ${bookingData.guestEmail}</p>
      <p><strong>Accommodation:</strong> ${bookingData.accommodationName}</p>
      <p><strong>Check-in:</strong> ${new Date(bookingData.checkInDate).toLocaleDateString()}</p>
      <p><strong>Check-out:</strong> ${new Date(bookingData.checkOutDate).toLocaleDateString()}</p>
      <p><strong>Number of Guests:</strong> ${bookingData.numberOfGuests}</p>
      <p><strong>Total Amount:</strong> $${bookingData.totalAmount}</p>
      <p><strong>Status:</strong> ${bookingData.status}</p>
      ${bookingData.specialRequests ? `<p><strong>Special Requests:</strong> ${bookingData.specialRequests}</p>` : ''}
      <hr>
      <p>Please review and confirm this booking in the admin panel.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ New booking notification sent to admin');
  } catch (error) {
    console.error('❌ Failed to send booking notification:', error);
  }
};

export const sendBookingCancellationNotification = async (
  bookingData: BookingEmailData,
  cancellationReason?: string
): Promise<void> => {
  const adminEmail = process.env.EMAIL_FROM;
  
  if (!adminEmail) {
    console.warn('Admin email not configured. Skipping notification.');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: adminEmail,
    subject: `❌ Booking Cancelled - ${bookingData.guestName}`,
    html: `
      <h2>Booking Cancellation Notification</h2>
      <p><strong>Guest Name:</strong> ${bookingData.guestName}</p>
      <p><strong>Guest Email:</strong> ${bookingData.guestEmail}</p>
      <p><strong>Accommodation:</strong> ${bookingData.accommodationName}</p>
      <p><strong>Check-in:</strong> ${new Date(bookingData.checkInDate).toLocaleDateString()}</p>
      <p><strong>Check-out:</strong> ${new Date(bookingData.checkOutDate).toLocaleDateString()}</p>
      ${cancellationReason ? `<p><strong>Cancellation Reason:</strong> ${cancellationReason}</p>` : ''}
      <hr>
      <p>This booking has been cancelled.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Booking cancellation notification sent to admin');
  } catch (error) {
    console.error('❌ Failed to send cancellation notification:', error);
  }
};

export const sendGuestConfirmationEmail = async (bookingData: BookingEmailData): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: bookingData.guestEmail,
    subject: 'Your Resort Booking Confirmation',
    html: `
      <h2>Booking Confirmation</h2>
      <p>Dear ${bookingData.guestName},</p>
      <p>Thank you for choosing our resort! Your booking has been confirmed.</p>
      
      <h3>Booking Details:</h3>
      <p><strong>Accommodation:</strong> ${bookingData.accommodationName}</p>
      <p><strong>Check-in:</strong> ${new Date(bookingData.checkInDate).toLocaleDateString()}</p>
      <p><strong>Check-out:</strong> ${new Date(bookingData.checkOutDate).toLocaleDateString()}</p>
      <p><strong>Number of Guests:</strong> ${bookingData.numberOfGuests}</p>
      <p><strong>Total Amount:</strong> $${bookingData.totalAmount}</p>
      
      <p>We look forward to welcoming you!</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent to guest');
  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error);
  }
};