"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "../auth/auth";
import connectDB from "../db";
import { Board, Column, JobApplication } from "../models";
interface jobApplicationData {
  company: string;
  position: string;
  location?: string;
  notes?: string;
  salary?: string;
  jobUrl?: string;
  tags?: string[];
  description?: string;
  columnId: string;
  boardId: string;
}
export async function createJobApplication(data: jobApplicationData) {
  const session = await getSession();
  const {
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    tags,
    description,
    columnId,
    boardId,
  } = data;
  if (!session?.user) {
    return { error: "Unauthorized" };
  }
  await connectDB();
  if (!company || !position || !columnId || !boardId) {
    return { error: "Missing required fields" };
  }
  const board = await Board.findOne({
    _id: boardId,
    userId: session.user.id,
  });
  if (!board) {
    return { error: "Board not found" };
  }
  const column = await Column.findOne({
    _id: columnId,
    boardId: boardId,
  });
  if (!column) {
    return { error: "Column not found" };
  }
  const maxOrder = (await JobApplication.findOne({ columnId })
    .sort({ order: -1 })
    .select("order")
    .lean()) as { order: number } | null;
  const jobApplication = await JobApplication.create({
    userId: session.user.id,
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    tags: tags || [],
    description,
    columnId,
    boardId,
    status: "applied",
    order: maxOrder ? maxOrder.order + 1 : 0,
  });
  await Column.findByIdAndUpdate(columnId, {
    $push: { jobApplications: jobApplication._id },
  });
  revalidatePath("/dashboard");
  return { data: JSON.parse(JSON.stringify(jobApplication)) };
}

export async function UpdateJobApplication(
  id: string,
  updates: {
    company?: string;
    position?: string;
    location?: string;
    notes?: string;
    salary?: string;
    jobUrl?: string;
    tags?: string[];
    description?: string;
    columnId?: string;
    order?: number;
  },
) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const jobApplication = await JobApplication.findById(id);

  if (!jobApplication) {
    return { error: "Job application not found" };
  }

  if (jobApplication.userId !== session?.user.id) {
    return { error: "Unauthorized" };
  }

  const { columnId, order, ...otherUpdates } = updates;
  const updatesToApply: Partial<{
    company?: string;
    position: string;
    location: string;
    notes: string;
    salary: string;
    jobUrl: string;
    tags: string[];
    description: string;
    columnId: string;
    order: number;
  }> = otherUpdates;

  const currentColumnId = jobApplication.columnId.toString();
  const newColumnId = columnId?.toString();

  const isMovingToDiffrentColumnt =
    newColumnId && newColumnId !== currentColumnId;

  if (isMovingToDiffrentColumnt) {
    await Column.findByIdAndUpdate(currentColumnId, {
      $pull: { jobApplications: id },
    });
    const jobsInTargetColumn = await JobApplication.find({
      columnId: newColumnId,
      _id: { $ne: id },
    })
      .sort({ order: 1 })
      .lean();

    let newOrderValue: number;
    if (order !== undefined && order !== null) {
      newOrderValue = order * 100;

      const jobsThatNeedToShift = jobsInTargetColumn.slice(order);
      for (const job of jobsThatNeedToShift) {
        await JobApplication.findByIdAndUpdate(job._id, {
          $set: { order: job.order + 100 },
        });
      }
    } else {
      if (jobsInTargetColumn.length > 0) {
        const lastJobOrder =
          jobsInTargetColumn[jobsInTargetColumn.length - 1].order || 0;
        newOrderValue = lastJobOrder + 100;
      } else {
        newOrderValue = 0;
      }
    }
    updatesToApply.columnId = newColumnId;
    updatesToApply.order = newOrderValue;
    await Column.findByIdAndUpdate(newColumnId, {
      $push: {
        jobApplications: id,
      },
    });
  } else if (order !== undefined && order !== null) {
    const otherJobsInColumn = await JobApplication.find({
      columnId: currentColumnId,
      _id: { $ne: id },
    })
      .sort({ order: 1 })
      .lean();

    const currentJobOrder = jobApplication.order || 0;

    const currentPositonIndex = otherJobsInColumn.findIndex(
      (job) => job.order > currentJobOrder,
    );
    const oldPositionIndex =
      currentPositonIndex === -1
        ? otherJobsInColumn.length
        : currentPositonIndex;

    const newOrderValue = order * 100;
    if (order < oldPositionIndex) {
      const jobToShiftDown = otherJobsInColumn.slice(order, oldPositionIndex);

      for (const job of jobToShiftDown) {
        await JobApplication.findByIdAndUpdate(job._id, {
          $set: { order: job.order + 100 },
        });
      }
    } else if (order > oldPositionIndex) {
      const jobToShiftUp = otherJobsInColumn.slice(oldPositionIndex, order);
      for (const job of jobToShiftUp) {
        const newOrder = Math.max(0, job.order - 100);
        await JobApplication.findByIdAndUpdate(job._id, {
          $set: { order: newOrder },
        });
      }
    }
    updatesToApply.order = newOrderValue;
  }
  const updated = await JobApplication.findByIdAndUpdate(id, updatesToApply, {
    new: true,
  });

  revalidatePath("/dashboard");
  return { data: JSON.parse(JSON.stringify(updated)) };
}

export async function deleteJobApplication(id: string) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const jobApplication = await JobApplication.findById(id);

  if (!jobApplication) {
    return { error: "Job application not found" };
  }

  if (jobApplication.userId !== session?.user.id) {
    return { error: "Unauthorized" };
  }

  await Column.findByIdAndUpdate(jobApplication.columnId, {
    $pull: {
      jobApplications: id,
    },
  });

  await JobApplication.deleteOne({ _id: id });

  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteColumn(id: string) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const column = await Column.findById(id);

  if (!column) {
    return { error: "Column not found" };
  }

  const board = await Board.findById(column.boardId);

  if (!board) {
    return { error: "Board not found" };
  }

  if (board.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  try {
    await JobApplication.deleteMany({ columnId: id });

    await Column.deleteOne({ _id: id });
    await Board.updateOne({ _id: board._id }, { $pull: { columns: id } });
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete column" };
  }

  revalidatePath("/dashboard");

  return { success: true };
}
