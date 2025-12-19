import type { Prisma } from "@prisma/client";

import { prisma } from "../../../lib/prisma";

export class TaskRepository {
  create(data: {
    title: string;
    description: string;
    dueDate: Date;
    priority: string;
    status: string;
    creatorId: string;
    assignedToId?: string | null;
  }) {
    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        priority: data.priority as any,
        status: data.status as any,
        creatorId: data.creatorId,
        assignedToId: data.assignedToId ?? null,
      },
      include: {
        creator: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    });
  }

  findVisibleById(taskId: string, userId: string) {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [{ creatorId: userId }, { assignedToId: userId }],
      },
      include: {
        creator: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    });
  }

  listVisible(params: {
    userId: string;
    status?: string;
    priority?: string;
    sortDueDate?: "asc" | "desc";
  }) {
    const where: Prisma.TaskWhereInput = {
      OR: [{ creatorId: params.userId }, { assignedToId: params.userId }],
    };
    if (params.status) where.status = params.status as any;
    if (params.priority) where.priority = params.priority as any;

    return prisma.task.findMany({
      where,
      orderBy: {
        dueDate: params.sortDueDate ?? "asc",
      },
      include: {
        creator: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    });
  }

  update(taskId: string, data: {
    title?: string;
    description?: string;
    dueDate?: Date;
    priority?: string;
    status?: string;
    assignedToId?: string | null;
  }) {
    return prisma.task.update({
      where: { id: taskId },
      data: data as any,
      include: {
        creator: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    });
  }

  delete(taskId: string) {
    return prisma.task.delete({ where: { id: taskId } });
  }

  dashboard(userId: string) {
    const now = new Date();

    return Promise.all([
      prisma.task.findMany({
        where: { assignedToId: userId },
        orderBy: { dueDate: "asc" },
      }),
      prisma.task.findMany({
        where: { creatorId: userId },
        orderBy: { dueDate: "asc" },
      }),
      prisma.task.findMany({
        where: {
          OR: [{ creatorId: userId }, { assignedToId: userId }],
          dueDate: { lt: now },
          NOT: { status: "COMPLETED" },
        },
        orderBy: { dueDate: "asc" },
      }),
    ]).then(([assignedToMe, createdByMe, overdue]) => ({
      assignedToMe,
      createdByMe,
      overdue,
    }));
  }
}
