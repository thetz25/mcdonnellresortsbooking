import { Request, Response } from 'express';
import { Booking, Accommodation, Payment } from '../models';
import { Op, Sequelize } from 'sequelize';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get counts
    const totalBookings = await Booking.count();
    const pendingBookings = await Booking.count({ where: { status: 'pending' } });
    const confirmedBookings = await Booking.count({ where: { status: 'confirmed' } });
    const checkedInToday = await Booking.count({
      where: {
        status: 'checked_in',
        checkInDate: {
          [Op.lte]: today,
          [Op.gte]: new Date(today.setHours(0, 0, 0, 0))
        }
      }
    });

    // Get monthly revenue
    const monthlyRevenue = await Payment.sum('amount', {
      where: {
        status: 'completed',
        paymentDate: {
          [Op.gte]: startOfMonth
        }
      }
    }) || 0;

    // Get yearly revenue
    const yearlyRevenue = await Payment.sum('amount', {
      where: {
        status: 'completed',
        paymentDate: {
          [Op.gte]: startOfYear
        }
      }
    }) || 0;

    // Get upcoming check-ins (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingCheckIns = await Booking.findAll({
      where: {
        status: 'confirmed',
        checkInDate: {
          [Op.between]: [today, nextWeek]
        }
      },
      include: [{ model: Accommodation, as: 'accommodation' }],
      order: [['checkInDate', 'ASC']],
      limit: 10
    });

    // Get occupancy rate
    const totalAccommodations = await Accommodation.count({ where: { isActive: true } });
    const occupiedAccommodations = await Booking.count({
      where: {
        status: 'checked_in'
      },
      distinct: true,
      col: 'accommodation_id'
    });

    const occupancyRate = totalAccommodations > 0 
      ? Math.round((occupiedAccommodations / totalAccommodations) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalBookings,
          pendingBookings,
          confirmedBookings,
          checkedInToday,
          monthlyRevenue,
          yearlyRevenue,
          occupancyRate,
          totalAccommodations,
          occupiedAccommodations
        },
        upcomingCheckIns
      }
    });
  } catch (error) {
    throw error;
  }
};

export const getRevenueReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    const where: any = {
      status: 'completed'
    };

    if (startDate && endDate) {
      where.paymentDate = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    let dateFormat: string;
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      default:
        dateFormat = 'YYYY-MM';
    }

    const revenue = await Payment.findAll({
      where,
      attributes: [
        [Sequelize.fn('TO_CHAR', Sequelize.col('payment_date'), dateFormat), 'period'],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
      ],
      group: [Sequelize.fn('TO_CHAR', Sequelize.col('payment_date'), dateFormat)],
      order: [[Sequelize.fn('TO_CHAR', Sequelize.col('payment_date'), dateFormat), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: { revenue }
    });
  } catch (error) {
    throw error;
  }
};

export const getOccupancyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Get all accommodations
    const accommodations = await Accommodation.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'type']
    });

    // Get bookings within date range
    const bookings = await Booking.findAll({
      where: {
        status: {
          [Op.notIn]: ['cancelled']
        },
        [Op.or]: [
          {
            checkInDate: {
              [Op.between]: [start, end]
            }
          },
          {
            checkOutDate: {
              [Op.between]: [start, end]
            }
          }
        ]
      },
      attributes: ['accommodationId', 'checkInDate', 'checkOutDate', 'status']
    });

    // Calculate occupancy for each accommodation
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const occupancyData = accommodations.map(acc => {
      const accBookings = bookings.filter(b => b.accommodationId === acc.id);
      let occupiedDays = 0;

      accBookings.forEach(booking => {
        const bookingStart = new Date(booking.checkInDate);
        const bookingEnd = new Date(booking.checkOutDate);
        
        const overlapStart = bookingStart > start ? bookingStart : start;
        const overlapEnd = bookingEnd < end ? bookingEnd : end;
        
        if (overlapStart <= overlapEnd) {
          occupiedDays += Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
      });

      return {
        accommodationId: acc.id,
        accommodationName: acc.name,
        type: acc.type,
        occupiedDays,
        totalDays,
        occupancyRate: Math.round((occupiedDays / totalDays) * 100)
      };
    });

    res.json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        totalDays,
        accommodations: occupancyData
      }
    });
  } catch (error) {
    throw error;
  }
};

export const getBookingTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const { months = 6 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months as string));

    const bookings = await Booking.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [Sequelize.fn('TO_CHAR', Sequelize.col('created_at'), 'YYYY-MM'), 'month'],
        [Sequelize.fn('COUNT', '*'), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'revenue']
      ],
      group: [Sequelize.fn('TO_CHAR', Sequelize.col('created_at'), 'YYYY-MM')],
      order: [[Sequelize.fn('TO_CHAR', Sequelize.col('created_at'), 'YYYY-MM'), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: { bookings }
    });
  } catch (error) {
    throw error;
  }
};