import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { UserModel } from '../modules/users/user.model.js';

async function seed() {
  await connectDatabase();

  console.log('Seeding database...');

  const adminEmail = 'admin@mdwoodworks.com';
  const existingAdmin = await UserModel.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@12345', 12);

    await UserModel.create({
      name: 'MD Wood Works Admin',
      email: adminEmail,
      passwordHash,
      role: 'admin'
    });

    console.log(`Created admin user: ${adminEmail} / Admin@12345`);
  } else {
    console.log('Admin user already exists, skipping.');
  }

  await disconnectDatabase();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
