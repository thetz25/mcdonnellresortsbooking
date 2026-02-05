import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

export interface BookingAttributes {
  id: string;
  accommodationId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numberOfGuests: number;
  checkInDate: Date;
  checkOutDate: Date;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  totalAmount: number;
  source: 'jotform' | 'manual' | 'phone' | 'walk_in';
  jotformSubmissionId?: string;
  notes?: string;
  createdBy?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BookingCreationAttributes extends Optional<BookingAttributes, 'id' | 'createdAt' | 'updatedAt' | 'specialRequests' | 'notes' | 'createdBy' | 'cancelledAt' | 'cancellationReason' | 'jotformSubmissionId'> {}

class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
  public id!: string;
  public accommodationId!: string;
  public guestName!: string;
  public guestEmail!: string;
  public guestPhone!: string;
  public numberOfGuests!: number;
  public checkInDate!: Date;
  public checkOutDate!: Date;
  public specialRequests?: string;
  public status!: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  public totalAmount!: number;
  public source!: 'jotform' | 'manual' | 'phone' | 'walk_in';
  public jotformSubmissionId?: string;
  public notes?: string;
  public createdBy?: string;
  public cancelledAt?: Date;
  public cancellationReason?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Booking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    accommodationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'accommodation_id',
      references: {
        model: 'accommodations',
        key: 'id'
      }
    },
    guestName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'guest_name'
    },
    guestEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'guest_email',
      validate: {
        isEmail: true
      }
    },
    guestPhone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'guest_phone'
    },
    numberOfGuests: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'number_of_guests',
      validate: {
        min: 1
      }
    },
    checkInDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'check_in_date'
    },
    checkOutDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'check_out_date'
    },
    specialRequests: {
      type: DataTypes.TEXT,
      field: 'special_requests',
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount'
    },
    source: {
      type: DataTypes.ENUM('jotform', 'manual', 'phone', 'walk_in'),
      defaultValue: 'manual',
      allowNull: false
    },
    jotformSubmissionId: {
      type: DataTypes.STRING(100),
      field: 'jotform_submission_id',
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by',
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    cancelledAt: {
      type: DataTypes.DATE,
      field: 'cancelled_at',
      allowNull: true
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      field: 'cancellation_reason',
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'bookings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['accommodation_id', 'check_in_date', 'check_out_date']
      },
      {
        fields: ['status']
      },
      {
        fields: ['guest_email']
      }
    ]
  }
);

export default Booking;