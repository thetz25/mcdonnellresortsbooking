import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Payment, Booking } from '../models';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, bookingId, paymentType } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (bookingId) where.bookingId = bookingId;
    if (paymentType) where.paymentType = paymentType;

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: Booking,
          as: 'booking',
          attributes: ['id', 'guestName', 'guestEmail', 'accommodationId']
        }
      ],
      order: [['paymentDate', 'DESC']]
    });

    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    throw error;
  }
};

export const getPaymentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Booking,
          as: 'booking',
          include: ['accommodation']
        }
      ]
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    res.json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    throw error;
  }
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      bookingId,
      amount,
      paymentMethod,
      paymentType,
      transactionId,
      notes,
      paymentDate
    } = req.body;

    // Check if booking exists
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Check if booking is cancelled
    if (booking.status === 'cancelled') {
      throw new AppError('Cannot add payment to cancelled booking', 400);
    }

    const payment = await Payment.create({
      bookingId,
      amount,
      paymentMethod,
      paymentType,
      transactionId,
      notes,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      processedBy: req.userId
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: { payment }
    });
  } catch (error) {
    throw error;
  }
};

export const updatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      amount,
      paymentMethod,
      paymentType,
      status,
      transactionId,
      notes
    } = req.body;

    const payment = await Payment.findByPk(id);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    await payment.update({
      amount,
      paymentMethod,
      paymentType,
      status,
      transactionId,
      notes
    });

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: { payment }
    });
  } catch (error) {
    throw error;
  }
};

export const getPaymentsByBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    const payments = await Payment.findAll({
      where: { bookingId },
      order: [['paymentDate', 'DESC']]
    });

    // Calculate totals
    const totalPaid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    const totalRefunded = payments
      .filter(p => p.status === 'refunded')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    res.json({
      success: true,
      data: {
        payments,
        summary: {
          totalPaid,
          totalRefunded,
          balance: parseFloat(booking.totalAmount.toString()) - totalPaid + totalRefunded
        }
      }
    });
  } catch (error) {
    throw error;
  }
};

export const deletePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    await payment.destroy();

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    throw error;
  }
};