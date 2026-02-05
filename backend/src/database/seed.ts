import sequelize from './connection';
import { User, Accommodation } from '../models';
import { hashPassword } from '../utils/password';

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Seeding database...');

    // Create default admin user
    const adminPassword = await hashPassword('admin123');
    const [admin] = await User.findOrCreate({
      where: { email: 'admin@resort.com' },
      defaults: {
        email: 'admin@resort.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true
      }
    });

    console.log('✅ Admin user created:', admin.email);

    // Create sample accommodations (4 as requested)
    const accommodations = [
      {
        name: 'Ocean View Villa',
        description: 'Luxurious villa with stunning ocean views, private pool, and spacious living area.',
        type: 'villa' as const,
        maxGuests: 6,
        basePrice: 450.00,
        amenities: ['Private Pool', 'Ocean View', 'Kitchen', 'WiFi', 'Air Conditioning', 'Parking'],
        images: [],
        isActive: true
      },
      {
        name: 'Garden Suite',
        description: 'Elegant suite surrounded by tropical gardens with modern amenities.',
        type: 'suite' as const,
        maxGuests: 4,
        basePrice: 280.00,
        amenities: ['Garden View', 'Kitchenette', 'WiFi', 'Air Conditioning', 'Breakfast Included'],
        images: [],
        isActive: true
      },
      {
        name: 'Standard Room',
        description: 'Comfortable room with essential amenities perfect for couples.',
        type: 'room' as const,
        maxGuests: 2,
        basePrice: 120.00,
        amenities: ['WiFi', 'Air Conditioning', 'TV', 'Mini Bar'],
        images: [],
        isActive: true
      },
      {
        name: 'Beach Bungalow',
        description: 'Charming bungalow steps away from the beach with rustic charm.',
        type: 'bungalow' as const,
        maxGuests: 3,
        basePrice: 180.00,
        amenities: ['Beach Access', 'WiFi', 'Fan', 'Outdoor Shower', 'BBQ Area'],
        images: [],
        isActive: true
      }
    ];

    for (const acc of accommodations) {
      const [accommodation, created] = await Accommodation.findOrCreate({
        where: { name: acc.name },
        defaults: acc
      });
      
      if (created) {
        console.log(`✅ Accommodation created: ${accommodation.name}`);
      }
    }

    console.log('✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}