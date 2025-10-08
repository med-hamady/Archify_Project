// Script to create admin account directly in database
// Run with: node create-admin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Get first department
    const department = await prisma.department.findFirst();
    if (!department) {
      console.error('No department found. Please create a department first.');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@archify.ma',
        passwordHash: hashedPassword,
        name: 'Admin User',
        role: 'SUPERADMIN',
        departmentId: department.id,
        semester: 'S1'
      }
    });

    console.log('Admin created successfully:', admin);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
