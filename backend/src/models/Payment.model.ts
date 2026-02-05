import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

export interface PaymentAttributes {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'paypal' | 'other';
  paymentType: 'deposit' | 'full_payment' | 'partial_payment' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentDate: Date;
  notes?: string;
  processedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'transactionId' | 'notes' | 'processedBy'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: string;
  public bookingId!: string;
  public amount!: number;
  public paymentMethod!: 'credit_card' | 'bank_transfer' | 'cash' | 'paypal' | 'other';
  public paymentType!: 'deposit' | 'full_payment' | 'partial_payment' | 'refund';
  public status!: 'pending' | 'completed' | 'failed' | 'refunded';
  public transactionId?: string;
  public paymentDate!: Date;
  public notes?: string;
  public processedBy?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'booking_id',
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('credit_card', 'bank_transfer', 'cash', 'paypal', 'other'),
      allowNull: false,
      field: 'payment_method'
    },
    paymentType: {
      type: DataTypes.ENUM('deposit', 'full_payment', 'partial_payment', 'refund'),
      allowNull: false,
      field: 'payment_type'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING(255),
      field: 'transaction_id',
      allowNull: true
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'payment_date'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    processedBy: {
      type: DataTypes.UUID,
      field: 'processed_by',
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['booking_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['payment_date']
      }
    ]
  }
);

export default Payment;