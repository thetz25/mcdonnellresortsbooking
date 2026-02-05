import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Accommodation } from '../models';
import { AppError } from '../middleware/errorHandler';

export const getAllAccommodations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive, type } = req.query;
    
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (type) where.type = type;

    const accommodations = await Accommodation.findAll({
      where,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: { accommodations }
    });
  } catch (error) {
    throw error;
  }
};

export const getAccommodationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const accommodation = await Accommodation.findByPk(id);

    if (!accommodation) {
      throw new AppError('Accommodation not found', 404);
    }

    res.json({
      success: true,
      data: { accommodation }
    });
  } catch (error) {
    throw error;
  }
};

export const createAccommodation = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      name,
      description,
      type,
      maxGuests,
      basePrice,
      amenities,
      images
    } = req.body;

    const accommodation = await Accommodation.create({
      name,
      description,
      type,
      maxGuests,
      basePrice,
      amenities: amenities || [],
      images: images || []
    });

    res.status(201).json({
      success: true,
      message: 'Accommodation created successfully',
      data: { accommodation }
    });
  } catch (error) {
    throw error;
  }
};

export const updateAccommodation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      type,
      maxGuests,
      basePrice,
      amenities,
      images,
      isActive
    } = req.body;

    const accommodation = await Accommodation.findByPk(id);

    if (!accommodation) {
      throw new AppError('Accommodation not found', 404);
    }

    await accommodation.update({
      name,
      description,
      type,
      maxGuests,
      basePrice,
      amenities,
      images,
      isActive
    });

    res.json({
      success: true,
      message: 'Accommodation updated successfully',
      data: { accommodation }
    });
  } catch (error) {
    throw error;
  }
};

export const deleteAccommodation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const accommodation = await Accommodation.findByPk(id);

    if (!accommodation) {
      throw new AppError('Accommodation not found', 404);
    }

    await accommodation.destroy();

    res.json({
      success: true,
      message: 'Accommodation deleted successfully'
    });
  } catch (error) {
    throw error;
  }
};