import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

export interface AccommodationAttributes {
  id: string;
  name: string;
  description: string;
  type: 'villa' | 'suite' | 'room' | 'bungalow';
  maxGuests: number;
  basePrice: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AccommodationCreationAttributes extends Optional<AccommodationAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'images' | 'amenities'> {}

class Accommodation extends Model<AccommodationAttributes, AccommodationCreationAttributes> implements AccommodationAttributes {
  public id!: string;
  public name!: string;
  public description!: string;
  public type!: 'villa' | 'suite' | 'room' | 'bungalow';
  public maxGuests!: number;
  public basePrice!: number;
  public amenities!: string[];
  public images!: string[];
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Accommodation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('villa', 'suite', 'room', 'bungalow'),
      allowNull: false
    },
    maxGuests: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_guests',
      validate: {
        min: 1
      }
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'base_price'
    },
    amenities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: true
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  },
  {
    sequelize,
    tableName: 'accommodations',
    timestamps: true,
    underscored: true
  }
);

export default Accommodation;