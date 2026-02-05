import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Booking, Accommodation, Payment } from '../models';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { sendNewBookingNotification, sendBookingCancellationNotification, sendGuestConfirmationEmail } from '../utils/email';
import { Op } from 'sequelize';

export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, startDate, endDate, accommodationId } = req.query;
    
    const where: any = {};
    
    if (status) where.status = status;
    if (accommodationId) where.accommodationId = accommodationId;
    
    if (startDate && endDate) {
      where.checkInDate = {
        [Op.gte]: new Date(startDate as string)
      };
      where.checkOutDate = {
        [Op.lte]: new Date(endDate as string)
      };
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        {
          model: Accommodation,
          as: 'accommodation',
          attributes: ['id', 'name', 'type', 'maxGuests']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'status', 'paymentType']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { bookings }
    });
  } catch (error) {
    throw error;
  }
};

export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Accommodation,
          as: 'accommodation',
          attributes: ['id', 'name', 'type', 'maxGuests', 'basePrice']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'status', 'paymentMethod', 'paymentType', 'paymentDate', 'transactionId']
        }
      ]
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    throw error;
  }
};

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      accommodationId,
      guestName,
      guestEmail,
      guestPhone,
      numberOfGuests,
      checkInDate,
      checkOutDate,
      specialRequests,
      totalAmount,
      notes
    } = req.body;

    // Check if accommodation exists and has capacity
    const accommodation = await Accommodation.findByPk(accommodationId);
    if (!accommodation) {
      throw new AppError('Accommodation not found', 404);
    }

    if (numberOfGuests > accommodation.maxGuests) {
      throw new AppError(`Maximum ${accommodation.maxGuests} guests allowed for this accommodation`, 400);
    }

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      where: {
        accommodationId,
        status: {
          [Op.notIn]: ['cancelled', 'checked_out']
        },
        [Op.or]: [
          {
            checkInDate: {
              [Op.between]: [new Date(checkInDate), new Date(checkOutDate)]
            }
          },
          {
            checkOutDate: {
              [Op.between]: [new Date(checkInDate), new Date(checkOutDate)]
            }
          },
          {
            [Op.and]: [
              { checkInDate: { [Op.lte]: new Date(checkInDate) } },
              { checkOutDate: { [Op.gte]: new Date(checkOutDate) } }
            ]
          }
        ]
      }
    });

    if (overlappingBooking) {
      throw new AppError('Accommodation is not available for the selected dates', 400);
    }

    // Create booking
    const booking = await Booking.create({
      accommodationId,
      guestName,
      guestEmail,
      guestPhone,
      numberOfGuests,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      specialRequests,
      status: 'pending',
      totalAmount,
      notes,
      source: 'manual',
      createdBy: req.userId
    });

    // Send notifications
    const bookingWithAccommodation = await Booking.findByPk(booking.id, {
      include: [{ model: Accommodation, as: 'accommodation' }]
    });

    if (bookingWithAccommodation && bookingWithAccommodation.accommodation) {
      const emailData = {
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        accommodationName: bookingWithAccommodation.accommodation.name,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        numberOfGuests: booking.numberOfGuests,
        totalAmount: booking.totalAmount,
        specialRequests: booking.specialRequests || undefined,
        status: booking.status
      };

      await sendNewBookingNotification(emailData);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    throw error;
  }
};

export const updateBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      guestName,
      guestEmail,
      guestPhone,
      numberOfGuests,
      checkInDate,
      checkOutDate,
      specialRequests,
      totalAmount,
      status,
      notes
    } = req.body;

    const booking = await Booking.findByPk(id, {
      include: [{ model: Accommodation, as: 'accommodation' }]
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Check if trying to change dates and there are overlaps
    if ((checkInDate || checkOutDate) && booking.accommodation) {
      const newCheckIn = checkInDate ? new Date(checkInDate) : booking.checkInDate;
      const newCheckOut = checkOutDate ? new Date(checkOutDate) : booking.checkOutDate;

      const overlappingBooking = await Booking.findOne({
        where: {
          accommodationId: booking.accommodationId,
          id: { [Op.ne]: id },
          status: {
            [Op.notIn]: ['cancelled', 'checked_out']
          },
          [Op.or]: [
            {
              checkInDate: {
                [Op.between]: [newCheckIn, newCheckOut]
              }
            },
            {
              checkOutDate: {
                [Op.between]: [newCheckIn, newCheckOut]
              }
            }
          ]
        }
      });

      if (overlappingBooking) {
        throw new AppError('Accommodation is not available for the selected dates', 400);
      }
    }

    await booking.update({
      guestName,
      guestEmail,
      guestPhone,
      numberOfGuests,
      checkInDate: checkInDate ? new Date(checkInDate) : booking.checkInDate,
      checkOutDate: checkOutDate ? new Date(checkOutDate) : booking.checkOutDate,
      specialRequests,
      totalAmount,
      status,
      notes
    });

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: { booking }
    });
  } catch (error) {
    throw error;
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findByPk(id, {
      include: [{ model: Accommodation, as: 'accommodation' }]
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status === 'cancelled') {
      throw new AppError('Booking is already cancelled', 400);
    }

    await booking.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason
    });

    // Send cancellation notification
    if (booking.accommodation) {
      const emailData = {
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        accommodationName: booking.accommodation.name,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        numberOfGuests: booking.numberOfGuests,
        totalAmount: booking.totalAmount,
        status: 'cancelled'
      };

      await sendBookingCancellationNotification(emailData, reason);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    throw error;
  }
};

export const confirmBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id, {
      include: [{ model: Accommodation, as: 'accommodation' }]
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status !== 'pending') {
      throw new AppError('Only pending bookings can be confirmed', 400);
    }

    await booking.update({ status: 'confirmed' });

    // Send confirmation email to guest
    if (booking.accommodation) {
      const emailData = {
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        accommodationName: booking.accommodation.name,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        numberOfGuests: booking.numberOfGuests,
        totalAmount: booking.totalAmount,
        specialRequests: booking.specialRequests || undefined,
        status: 'confirmed'
      };

      await sendGuestConfirmationEmail(emailData);
    }

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: { booking }
    });
  } catch (error) {
    throw error;
  }
};

export const checkInBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status !== 'confirmed') {
      throw new AppError('Only confirmed bookings can be checked in', 400);
    }

    await booking.update({ status: 'checked_in' });

    res.json({
      success: true,
      message: 'Guest checked in successfully',
      data: { booking }
    });
  } catch (error) {
    throw error;
  }
};

export const checkOutBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status !== 'checked_in') {
      throw new AppError('Only checked-in bookings can be checked out', 400);
    }

    await booking.update({ status: 'checked_out' });

    res.json({
      success: true,
      message: 'Guest checked out successfully',
      data: { booking }
    });
  } catch (error) {
    throw error;
  }
};

export const deleteBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    await booking.destroy();

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    throw error;
  }
};