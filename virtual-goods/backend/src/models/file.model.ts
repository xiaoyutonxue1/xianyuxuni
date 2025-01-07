import prisma from '../config/database';

export const File = {
  create: async (data: {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
    type: string;
    description: string;
    userId: number;
  }) => {
    return await prisma.file.create({
      data
    });
  },

  findById: async (id: number) => {
    return await prisma.file.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
  },

  findAll: async (query: {
    userId?: number;
    type?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const { userId, type, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(userId ? { userId } : {}),
      ...(type ? { type } : {})
    };

    const [total, files] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          }
        }
      })
    ]);

    return {
      files,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  delete: async (id: number) => {
    return await prisma.file.delete({
      where: { id }
    });
  },

  // 批量删除文件
  deleteMany: async (ids: number[]) => {
    return await prisma.file.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });
  }
}; 