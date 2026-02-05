import { Request, Response } from 'express';
import { Booking, Accommodation } from '../models';
import { Op } from 'sequelize';
import { sendNewBookingNotification } from '../utils/email';

interface JotFormSubmission {
  pretty: string;
  q1_guestName?: string;
  q2_guestName?: { first?: string; last?: string };
  q3_guestEmail?: string;
  q4_guestPhone?: string;
  q5_accommodations?: string;
  q6_dates?: { start?: string; end?: string };
  q7_checkInDate?: string;
  q8_checkOutDate?: string;
  q9_numberOfGuests?: string;
  q10_specialRequests?: string;
  submission_id?: string;
}

export const handleJotFormWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📨 Received JotForm webhook:', req.body);

    const rawRequest = req.body.rawRequest || req.body;
    const submission: JotFormSubmission = typeof rawRequest === 'string' ? JSON.parse(rawRequest) : rawRequest;

    // Extract data from JotForm submission
    // Note: Field names will need to be adjusted based on your actual JotForm field IDs
    const guestName = extractGuestName(submission);
    const guestEmail = submission.q3_guestEmail || extractField(submission, 'email');
    const guestPhone = submission.q4_guestPhone || extractField(submission, 'phone');
    const accommodationName = submission.q5_accommodations || extractField(submission, 'accommodations');
    const numberOfGuests = parseInt(submission.q9_numberOfGuests || extractField(submission, 'numberOfGuests') || '1');
    const specialRequests = submission.q10_specialRequests || extractField(submission, 'specialRequests');
    
    // Extract dates
    const { checkInDate, checkOutDate } = extractDates(submission);

    // Validate required fields
    if (!guestName || !guestEmail || !accommodationName || !checkInDate || !checkOutDate) {
      console.error('❌ Missing required fields in JotForm submission');
      res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
      return;
    }

    // Find accommodation by name
    const accommodation = await Accommodation.findOne({
      where: {
        name: {
          [Op.iLike]: `%${accommodationName}%`
        },
        isActive: true
      }
    });

    if (!accommodation) {
      console.error(`❌ Accommodation not found: ${accommodationName}`);
      res.status(404).json({ 
        success: false, 
        message: 'Accommodation not found' 
      });
      return;
    }

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      where: {
        accommodationId: accommodation.id,
        status: {
          [Op.notIn]: ['cancelled', 'checked_out']
        },
        [Op.or]: [
          {
            checkInDate: {
              [Op.between]: [checkInDate, checkOutDate]
            }
          },
          {
            checkOutDate: {
              [Op.between]: [checkInDate, checkOutDate]
            }
          }
        ]
      }
    });

    if (overlappingBooking) {
      console.error('❌ Overlapping booking detected');
      res.status(409).json({ 
        success: false, 
        message: 'Accommodation not available for selected dates' 
      });
      return;
    }

    // Calculate total amount (simplified - you might want to add pricing logic)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = parseFloat(accommodation.basePrice.toString()) * nights;

    // Create booking
    const booking = await Booking.create({
      accommodationId: accommodation.id,
      guestName,
      guestEmail,
      guestPhone: guestPhone || 'Not provided',
      numberOfGuests,
      checkInDate,
      checkOutDate,
      specialRequests: specialRequests || undefined,
      status: 'pending',
      totalAmount,
      source: 'jotform',
      jotformSubmissionId: submission.submission_id || req.body.submissionID
    });

    // Send notification to admin
    const emailData = {
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      accommodationName: accommodation.name,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      numberOfGuests: booking.numberOfGuests,
      totalAmount: booking.totalAmount,
      specialRequests: booking.specialRequests || undefined,
      status: booking.status
    };

    await sendNewBookingNotification(emailData);

    console.log(`✅ Booking created from JotForm: ${booking.id}`);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('❌ Error processing JotForm webhook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Helper functions
function extractGuestName(submission: JotFormSubmission): string {
  // Try different possible field names
  if (submission.q1_guestName) return submission.q1_guestName;
  if (submission.q2_guestName) {
    if (typeof submission.q2_guestName === 'object') {
      const { first, last } = submission.q2_guestName;
      return `${first || ''} ${last || ''}`.trim();
    }
    return submission.q2_guestName;
  }
  
  // Try to find any field that might contain the name
  for (const [key, value] of Object.entries(submission)) {
    if (key.toLowerCase().includes('name') && typeof value === 'string') {
      return value;
    }
  }
  
  return '';
}

function extractDates(submission: JotFormSubmission): { checkInDate: Date | null; checkOutDate: Date | null } {
  let checkInDate: Date | null = null;
  let checkOutDate: Date | null = null;

  // Try date range field
  if (submission.q6_dates && typeof submission.q6_dates === 'object') {
    if (submission.q6_dates.start) {
      checkInDate = new Date(submission.q6_dates.start);
    }
    if (submission.q6_dates.end) {
      checkOutDate = new Date(submission.q6_dates.end);
    }
  }

  // Try separate date fields
  if (!checkInDate && submission.q7_checkInDate) {
    checkInDate = new Date(submission.q7_checkInDate);
  }
  if (!checkOutDate && submission.q8_checkOutDate) {
    checkOutDate = new Date(submission.q8_checkOutDate);
  }

  return { checkInDate, checkOutDate };
}

function extractField(submission: any, fieldName: string): string {
  // Generic field extractor - looks for fields containing the fieldName
  for (const [key, value] of Object.entries(submission)) {
    if (key.toLowerCase().includes(fieldName.toLowerCase()) && typeof value === 'string') {
      return value;
    }
  }
  return '';
}