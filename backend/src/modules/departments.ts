import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from './auth';

const prisma = new PrismaClient();
export const departmentsRouter = Router();

// Schemas
const departmentCreateSchema = z.object({
  name: z.string().min(1).max(100)
});

const departmentUpdateSchema = departmentCreateSchema.partial();

// GET /departments - Get all departments
departmentsRouter.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            courses: true,
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      courseCount: dept._count.courses,
      userCount: dept._count.users
    })));
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /departments/:id - Get department details
departmentsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            professor: true,
            semester: true,
            isPremium: true,
            views: true,
            createdAt: true,
            _count: {
              select: { lessons: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            semester: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            courses: true,
            users: true
          }
        }
      }
    });
    
    if (!department) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }
    
    res.json({
      id: department.id,
      name: department.name,
      courseCount: department._count.courses,
      userCount: department._count.users,
      courses: department.courses.map(course => ({
        id: course.id,
        title: course.title,
        professor: course.professor,
        semester: course.semester,
        isPremium: course.isPremium,
        views: course.views,
        lessonCount: course._count.lessons,
        createdAt: course.createdAt
      })),
      users: department.users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        semester: user.semester,
        createdAt: user.createdAt
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /departments - Create department (admin only)
departmentsRouter.post('/', requireAuth, async (req: any, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    
    const body = departmentCreateSchema.parse(req.body);
    
    // Check if department with same name already exists
    const existingDept = await prisma.department.findUnique({
      where: { name: body.name }
    });
    
    if (existingDept) {
      return res.status(409).json({ 
        error: { 
          code: 'DEPARTMENT_EXISTS', 
          message: 'Department with this name already exists' 
        } 
      });
    }
    
    const department = await prisma.department.create({
      data: body,
      include: {
        _count: {
          select: {
            courses: true,
            users: true
          }
        }
      }
    });
    
    res.status(201).json({
      id: department.id,
      name: department.name,
      courseCount: department._count.courses,
      userCount: department._count.users
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// PUT /departments/:id - Update department (admin only)
departmentsRouter.put('/:id', requireAuth, async (req: any, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    
    const { id } = req.params;
    const body = departmentUpdateSchema.parse(req.body);
    
    // Check if department exists
    const existingDept = await prisma.department.findUnique({ where: { id } });
    if (!existingDept) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }
    
    // Check if new name conflicts with existing department
    if (body.name && body.name !== existingDept.name) {
      const nameConflict = await prisma.department.findUnique({
        where: { name: body.name }
      });
      
      if (nameConflict) {
        return res.status(409).json({ 
          error: { 
            code: 'DEPARTMENT_EXISTS', 
            message: 'Department with this name already exists' 
          } 
        });
      }
    }
    
    const department = await prisma.department.update({
      where: { id },
      data: body,
      include: {
        _count: {
          select: {
            courses: true,
            users: true
          }
        }
      }
    });
    
    res.json({
      id: department.id,
      name: department.name,
      courseCount: department._count.courses,
      userCount: department._count.users
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// DELETE /departments/:id - Delete department (admin only)
departmentsRouter.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    
    const { id } = req.params;
    
    // Check if department exists
    const department = await prisma.department.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            courses: true,
            users: true
          }
        }
      }
    });
    
    if (!department) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }
    
    // Check if department has courses or users
    if (department._count.courses > 0 || department._count.users > 0) {
      return res.status(400).json({ 
        error: { 
          code: 'DEPARTMENT_IN_USE', 
          message: 'Cannot delete department with courses or users' 
        } 
      });
    }
    
    await prisma.department.delete({ where: { id } });
    
    res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});
