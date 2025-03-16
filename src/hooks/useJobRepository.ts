import { useSQLiteContext } from 'expo-sqlite';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Job model
export interface Job {
  id: string;
  clientId: string;
  vehicleId: string;
  title: string;
  description: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'invoiced' | 'paid' | 'canceled';
  jobType: 'repair' | 'maintenance' | 'diagnosis' | 'estimate' | 'other';
  isHomeVisit: boolean;
  locationAddress?: string;
  locationNotes?: string;
  scheduledDate?: string;
  startDate?: string;
  completionDate?: string;
  estimateProvided: boolean;
  estimateAccepted?: boolean;
  estimateAmount?: number;
  totalCost: number;
  invoiceNumber?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Job input for creating/updating
export interface JobInput {
  clientId: string;
  vehicleId: string;
  title: string;
  description: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'invoiced' | 'paid' | 'canceled';
  jobType: 'repair' | 'maintenance' | 'diagnosis' | 'estimate' | 'other';
  isHomeVisit: boolean;
  locationAddress?: string;
  locationNotes?: string;
  scheduledDate?: string;
  startDate?: string;
  completionDate?: string;
  estimateProvided: boolean;
  estimateAccepted?: boolean;
  estimateAmount?: number;
  totalCost: number;
  invoiceNumber?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  paymentMethod?: string;
  notes?: string;
}

// Job list item (for displaying in lists)
export interface JobListItem {
  id: string;
  title: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'invoiced' | 'paid' | 'canceled';
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehicleInfo: string;
  scheduledDate?: string;
  completionDate?: string;
  totalCost: number;
  photoUri?: string;
}

// Job with detailed information (for job details screen)
export interface JobWithDetails {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'invoiced' | 'paid' | 'canceled';
  jobType: 'repair' | 'maintenance' | 'diagnosis' | 'estimate' | 'other';
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehicleInfo: string;
  isHomeVisit: boolean;
  locationAddress?: string;
  locationNotes?: string;
  scheduledDate?: string;
  startDate?: string;
  completionDate?: string;
  estimateProvided: boolean;
  estimateAccepted?: boolean;
  estimateAmount?: number;
  totalCost: number;
  invoiceNumber?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  paymentMethod?: string;
  notes?: string;
}

// Part model
export interface Part {
  id: string;
  jobId: string;
  name: string;
  partNumber?: string;
  manufacturer?: string;
  quantity: number;
  unitCost: number;
  markupPercentage?: number;
  clientPrice: number;
  totalCost: number;
  supplier?: string;
  warrantyHasCoverage: boolean;
  warrantyLengthInMonths?: number;
  warrantyLengthInMiles?: number;
  warrantyExpirationDate?: string;
  warrantyNotes?: string;
  replacedPartCondition?: string;
  isClientSupplied?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Labor entry model
export interface LaborEntry {
  id: string;
  jobId: string;
  description: string;
  hours: number;
  rate: number;
  totalCost: number;
  technician?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Diagnostic item model
export interface DiagnosticItem {
  id: string;
  jobId: string;
  system: string;
  component: string;
  issue: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  recommendedAction: string;
  estimatedCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Job photo model
export interface JobPhoto {
  id: string;
  jobId: string;
  photoUri: string;
  photoType: 'before' | 'after' | 'diagnostic' | 'other';
  description?: string;
  createdAt: string;
}

/**
 * Hook for job-related database operations
 */
export function useJobRepository() {
  const db = useSQLiteContext();

  /**
   * Get all jobs
   */
  const getAll = async (): Promise<JobListItem[]> => {
    return db.getAllAsync<JobListItem>(`
      SELECT 
        j.id, j.title, j.status, j.clientId, j.vehicleId, j.scheduledDate, j.totalCost,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo,
        (
          SELECT photoUri FROM job_photos 
          WHERE jobId = j.id 
          ORDER BY createdAt DESC LIMIT 1
        ) as photoUri
      FROM jobs j
      JOIN clients c ON j.clientId = c.id
      JOIN vehicles v ON j.vehicleId = v.id
      ORDER BY 
        CASE 
          WHEN j.status = 'in-progress' THEN 1
          WHEN j.status = 'scheduled' THEN 2
          WHEN j.status = 'completed' THEN 3
          WHEN j.status = 'invoiced' THEN 4
          WHEN j.status = 'paid' THEN 5
          WHEN j.status = 'canceled' THEN 6
          ELSE 7
        END,
        j.scheduledDate ASC,
        j.createdAt DESC
    `);
  };

  /**
   * Get jobs for a specific client
   */
  const getByClientId = async (clientId: string): Promise<JobListItem[]> => {
    return db.getAllAsync<JobListItem>(
      `
      SELECT 
        j.id, j.title, j.status, j.clientId, j.vehicleId, j.scheduledDate, j.totalCost,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo,
        (
          SELECT photoUri FROM job_photos 
          WHERE jobId = j.id 
          ORDER BY createdAt DESC LIMIT 1
        ) as photoUri
      FROM jobs j
      JOIN clients c ON j.clientId = c.id
      JOIN vehicles v ON j.vehicleId = v.id
      WHERE j.clientId = ?
      ORDER BY 
        CASE 
          WHEN j.status = 'in-progress' THEN 1
          WHEN j.status = 'scheduled' THEN 2
          WHEN j.status = 'completed' THEN 3
          WHEN j.status = 'invoiced' THEN 4
          WHEN j.status = 'paid' THEN 5
          WHEN j.status = 'canceled' THEN 6
          ELSE 7
        END,
        j.scheduledDate ASC,
        j.createdAt DESC
    `,
      clientId
    );
  };

  /**
   * Get jobs for a specific vehicle
   */
  const getByVehicleId = async (vehicleId: string): Promise<JobListItem[]> => {
    return db.getAllAsync<JobListItem>(
      `
      SELECT 
        j.id, j.title, j.status, j.clientId, j.vehicleId, j.scheduledDate, j.totalCost,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo,
        (
          SELECT photoUri FROM job_photos 
          WHERE jobId = j.id 
          ORDER BY createdAt DESC LIMIT 1
        ) as photoUri
      FROM jobs j
      JOIN clients c ON j.clientId = c.id
      JOIN vehicles v ON j.vehicleId = v.id
      WHERE j.vehicleId = ?
      ORDER BY 
        CASE 
          WHEN j.status = 'in-progress' THEN 1
          WHEN j.status = 'scheduled' THEN 2
          WHEN j.status = 'completed' THEN 3
          WHEN j.status = 'invoiced' THEN 4
          WHEN j.status = 'paid' THEN 5
          WHEN j.status = 'canceled' THEN 6
          ELSE 7
        END,
        j.scheduledDate ASC,
        j.createdAt DESC
    `,
      vehicleId
    );
  };

  /**
   * Get a job by ID
   */
  const getById = async (id: string): Promise<Job | null> => {
    const job = await db.getFirstAsync<Job>(
      `
      SELECT * FROM jobs 
      WHERE id = ?
    `,
      id
    );

    return job || null;
  };

  /**
   * Get a job with client and vehicle details
   */
  const getJobWithDetails = async (id: string): Promise<JobWithDetails | null> => {
    const job = await db.getFirstAsync<JobWithDetails>(
      `
      SELECT 
        j.*,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM jobs j
      JOIN clients c ON j.clientId = c.id
      JOIN vehicles v ON j.vehicleId = v.id
      WHERE j.id = ?
    `,
      id
    );

    return job || null;
  };

  /**
   * Get all parts for a job
   */
  const getJobParts = async (jobId: string): Promise<Part[]> => {
    return db.getAllAsync<Part>(
      `
      SELECT * FROM parts
      WHERE jobId = ?
      ORDER BY createdAt ASC
    `,
      jobId
    );
  };

  /**
   * Get all labor entries for a job
   */
  const getJobLaborEntries = async (jobId: string): Promise<LaborEntry[]> => {
    return db.getAllAsync<LaborEntry>(
      `
      SELECT * FROM labor_entries
      WHERE jobId = ?
      ORDER BY createdAt ASC
    `,
      jobId
    );
  };

  /**
   * Get all diagnostic items for a job
   */
  const getJobDiagnosticItems = async (jobId: string): Promise<DiagnosticItem[]> => {
    return db.getAllAsync<DiagnosticItem>(
      `
      SELECT * FROM diagnostic_items
      WHERE jobId = ?
      ORDER BY createdAt ASC
    `,
      jobId
    );
  };

  /**
   * Get all photos for a job
   */
  const getJobPhotos = async (jobId: string): Promise<JobPhoto[]> => {
    return db.getAllAsync<JobPhoto>(
      `
      SELECT * FROM job_photos
      WHERE jobId = ?
      ORDER BY createdAt DESC
    `,
      jobId
    );
  };

  /**
   * Search jobs by title, client name, or vehicle info
   */
  const search = async (searchTerm: string): Promise<JobListItem[]> => {
    const term = `%${searchTerm}%`;

    return db.getAllAsync<JobListItem>(
      `
      SELECT 
        j.id, j.title, j.status, j.clientId, j.vehicleId, j.scheduledDate, j.totalCost,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo,
        (
          SELECT photoUri FROM job_photos 
          WHERE jobId = j.id 
          ORDER BY createdAt DESC LIMIT 1
        ) as photoUri
      FROM jobs j
      JOIN clients c ON j.clientId = c.id
      JOIN vehicles v ON j.vehicleId = v.id
      WHERE 
        j.title LIKE ? OR 
        (c.firstName || ' ' || c.lastName) LIKE ? OR
        (v.year || ' ' || v.make || ' ' || v.model) LIKE ?
      ORDER BY j.createdAt DESC
    `,
      term,
      term,
      term
    );
  };

  /**
   * Create a new job
   */
  const create = async (input: JobInput): Promise<Job> => {
    const now = new Date().toISOString();
    const id = uuidv4();

    const job: Job = {
      id,
      clientId: input.clientId,
      vehicleId: input.vehicleId,
      title: input.title,
      description: input.description,
      status: input.status,
      jobType: input.jobType,
      isHomeVisit: input.isHomeVisit,
      locationAddress: input.locationAddress,
      locationNotes: input.locationNotes,
      scheduledDate: input.scheduledDate,
      startDate: input.startDate,
      completionDate: input.completionDate,
      estimateProvided: input.estimateProvided,
      estimateAccepted: input.estimateAccepted,
      estimateAmount: input.estimateAmount,
      totalCost: input.totalCost,
      invoiceNumber: input.invoiceNumber,
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `
          INSERT INTO jobs (
            id, clientId, vehicleId, title, description, status, jobType,
            isHomeVisit, locationAddress, locationNotes, scheduledDate, startDate, completionDate,
            estimateProvided, estimateAccepted, estimateAmount, totalCost,
            invoiceNumber, paymentStatus, paymentMethod, notes, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          job.id,
          job.clientId,
          job.vehicleId,
          job.title,
          job.description,
          job.status,
          job.jobType,
          job.isHomeVisit ? 1 : 0,
          job.locationAddress || null,
          job.locationNotes || null,
          job.scheduledDate || null,
          job.startDate || null,
          job.completionDate || null,
          job.estimateProvided ? 1 : 0,
          job.estimateAccepted === undefined ? null : job.estimateAccepted ? 1 : 0,
          job.estimateAmount || null,
          job.totalCost,
          job.invoiceNumber || null,
          job.paymentStatus || null,
          job.paymentMethod || null,
          job.notes || null,
          job.createdAt,
          job.updatedAt
        );
      });

      return job;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  };

  /**
   * Update an existing job
   */
  const update = async (id: string, input: JobInput): Promise<Job> => {
    // First check if job exists
    const existingJob = await getById(id);
    if (!existingJob) {
      throw new Error(`Job with ID ${id} not found`);
    }

    const now = new Date().toISOString();

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `
          UPDATE jobs 
          SET 
            clientId = ?, 
            vehicleId = ?, 
            title = ?, 
            description = ?, 
            status = ?, 
            jobType = ?,
            isHomeVisit = ?, 
            locationAddress = ?, 
            locationNotes = ?, 
            scheduledDate = ?, 
            startDate = ?, 
            completionDate = ?,
            estimateProvided = ?, 
            estimateAccepted = ?, 
            estimateAmount = ?, 
            totalCost = ?,
            invoiceNumber = ?, 
            paymentStatus = ?, 
            paymentMethod = ?, 
            notes = ?,
            updatedAt = ?
          WHERE id = ?
        `,
          input.clientId,
          input.vehicleId,
          input.title,
          input.description,
          input.status,
          input.jobType,
          input.isHomeVisit ? 1 : 0,
          input.locationAddress || null,
          input.locationNotes || null,
          input.scheduledDate || null,
          input.startDate || null,
          input.completionDate || null,
          input.estimateProvided ? 1 : 0,
          input.estimateAccepted === undefined ? null : input.estimateAccepted ? 1 : 0,
          input.estimateAmount || null,
          input.totalCost,
          input.invoiceNumber || null,
          input.paymentStatus || null,
          input.paymentMethod || null,
          input.notes || null,
          now,
          id
        );
      });

      // Return the updated job
      const updatedJob = await getById(id);
      if (!updatedJob) {
        throw new Error('Failed to retrieve updated job');
      }

      return updatedJob;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  };

  /**
   * Delete a job by ID
   */
  const deleteJob = async (id: string): Promise<boolean> => {
    try {
      await db.withTransactionAsync(async () => {
        // Delete related records first to maintain referential integrity
        await db.runAsync('DELETE FROM job_photos WHERE jobId = ?', id);
        await db.runAsync(
          'DELETE FROM diagnostic_photos WHERE diagnosticItemId IN (SELECT id FROM diagnostic_items WHERE jobId = ?)',
          id
        );
        await db.runAsync('DELETE FROM diagnostic_items WHERE jobId = ?', id);
        await db.runAsync(
          'DELETE FROM part_photos WHERE partId IN (SELECT id FROM parts WHERE jobId = ?)',
          id
        );
        await db.runAsync(
          'DELETE FROM warranty_photos WHERE partId IN (SELECT id FROM parts WHERE jobId = ?)',
          id
        );
        await db.runAsync('DELETE FROM parts WHERE jobId = ?', id);
        await db.runAsync('DELETE FROM labor_entries WHERE jobId = ?', id);

        // Then delete the job itself
        await db.runAsync('DELETE FROM jobs WHERE id = ?', id);
      });

      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      return false;
    }
  };

  /**
   * Add a photo to a job
   */
  const addJobPhoto = async (
    jobId: string,
    photoUri: string,
    photoType: 'before' | 'after' | 'diagnostic' | 'other',
    description?: string
  ): Promise<JobPhoto> => {
    const now = new Date().toISOString();
    const id = uuidv4();

    const photo: JobPhoto = {
      id,
      jobId,
      photoUri,
      photoType,
      description,
      createdAt: now,
    };

    await db.runAsync(
      `
      INSERT INTO job_photos (id, jobId, photoUri, photoType, description, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      photo.id,
      photo.jobId,
      photo.photoUri,
      photo.photoType,
      photo.description || null,
      photo.createdAt
    );

    return photo;
  };

  /**
   * Delete a job photo
   */
  const deleteJobPhoto = async (photoId: string): Promise<boolean> => {
    try {
      await db.runAsync('DELETE FROM job_photos WHERE id = ?', photoId);
      return true;
    } catch (error) {
      console.error('Error deleting job photo:', error);
      return false;
    }
  };

  /**
   * Get count of jobs
   */
  const getCount = async (): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM jobs');
    return result?.count || 0;
  };

  /**
   * Get count of jobs with specific status
   */
  const getCountByStatus = async (status: string): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM jobs WHERE status = ?',
      status
    );
    return result?.count || 0;
  };

  return {
    getAll,
    getByClientId,
    getByVehicleId,
    getById,
    getJobWithDetails,
    getJobParts,
    getJobLaborEntries,
    getJobDiagnosticItems,
    getJobPhotos,
    search,
    create,
    update,
    delete: deleteJob,
    addJobPhoto,
    deleteJobPhoto,
    getCount,
    getCountByStatus,
  };
}
