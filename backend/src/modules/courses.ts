import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from './auth';

const prisma = new PrismaClient();
export const coursesRouter = Router();

// Schemas
const courseQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  department: z.string().optional(),
  semester: z.string().optional(),
  isPremium: z.string().optional().transform(val => val === 'true'),
  tags: z.string().optional().transform(val => val ? val.split(',') : [])
});

const courseCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  semester: z.string().min(1),
  professor: z.string().min(1),
  departmentId: z.string().uuid(),
  tags: z.array(z.string()).default([]),
  isPremium: z.boolean().default(false)
});

const courseUpdateSchema = courseCreateSchema.partial();

// Helper to format course data for public view
function getCoursePublic(course: any) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    semester: course.semester,
    professor: course.professor,
    department: course.department?.name,
    departmentId: course.departmentId,
    tags: course.tags,
    isPremium: course.isPremium,
    views: course.views,
    lessonCount: course.lessons?.length || 0,
    createdAt: course.createdAt
  };
}

// GET /courses - List courses with filtering and pagination
coursesRouter.get('/', async (req, res) => {
  try {
    const query = courseQuerySchema.parse(req.query);
    const { page, limit, search, department, semester, isPremium, tags } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { professor: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (department) {
      where.department = { name: { contains: department, mode: 'insensitive' } };
    }

    if (semester) {
      where.semester = semester;
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium;
    }

    if (tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          department: { select: { name: true } },
          lessons: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.course.count({ where })
    ]);

    return res.json({
      courses: courses.map(getCoursePublic),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    console.error('Error fetching courses:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /courses/:id - Get a single course with lessons
coursesRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        department: { select: { name: true } },
        lessons: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found' } });
    }

    return res.json(getCoursePublic(course));
  } catch (err: any) {
    console.error('Error fetching course:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// GET /courses/:id/lessons - Get lessons for a specific course
coursesRouter.get('/:id/lessons', async (req, res) => {
  try {
    const { id } = req.params;

    const lessons = await prisma.lesson.findMany({
      where: { courseId: id },
      orderBy: { orderIndex: 'asc' }
    });

    res.json(lessons);
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// POST /courses - Create a new course (Admin only)
coursesRouter.post('/', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
  }

  try {
    const body = courseCreateSchema.parse(req.body);

    const course = await prisma.course.create({
      data: {
        ...body,
        tags: body.tags,
        views: 0
      },
      include: {
        department: { select: { name: true } }
      }
    });

    return res.status(201).json(course);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    console.error('Error creating course:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// PUT /courses/:id - Update a course (Admin only)
coursesRouter.put('/:id', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
  }

  try {
    const { id } = req.params;
    const body = courseUpdateSchema.parse(req.body);

    const course = await prisma.course.update({
      where: { id },
      data: body,
      include: {
        department: { select: { name: true } }
      }
    });

    return res.json(course);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    console.error('Error updating course:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});

// DELETE /courses/:id - Delete a course (Admin only)
coursesRouter.delete('/:id', requireAuth, async (req: any, res) => {
  if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
  }

  try {
    const { id } = req.params;

    await prisma.course.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: any) {
    console.error('Error deleting course:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
  }
});
