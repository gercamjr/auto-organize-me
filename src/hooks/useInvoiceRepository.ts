import { useSQLiteContext } from 'expo-sqlite';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Invoice model
export interface Invoice {
  id: string;
  jobId: string;
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  status: 'draft' | 'issued' | 'paid' | 'partial' | 'overdue' | 'canceled';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

// Invoice input for creating/updating
export interface InvoiceInput {
  jobId: string;
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  status: 'draft' | 'issued' | 'paid' | 'partial' | 'overdue' | 'canceled';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  termsAndConditions?: string;
}

// Invoice list item (for displaying in lists)
export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  jobId: string;
  jobTitle: string;
  clientId: string;
  clientName: string;
  vehicleInfo: string;
  issuedDate: string;
  dueDate: string;
  status: 'draft' | 'issued' | 'paid' | 'partial' | 'overdue' | 'canceled';
  totalAmount: number;
}

// Payment model
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

// Payment input for creating
export interface PaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
}

/**
 * Hook for invoice-related database operations
 */
export function useInvoiceRepository() {
  const db = useSQLiteContext();

  /**
   * Get all invoices
   */
  const getAll = async (): Promise<InvoiceListItem[]> => {
    return db.getAllAsync<InvoiceListItem>(`
      SELECT 
        i.id, i.invoiceNumber, i.jobId, i.issuedDate, i.dueDate, i.status, i.totalAmount,
        j.title as jobTitle, j.clientId,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM invoices i
      JOIN jobs j ON i.jobId = j.id
      JOIN clients c ON j.clientId = c.id
      JOIN vehicles v ON j.vehicleId = v.id
      ORDER BY i.issuedDate DESC
    `);
  };

  /**
   * Get invoices for a specific client
   */
  const getByClientId = async (clientId: string): Promise<InvoiceListItem[]> => {
    return db.getAllAsync<InvoiceListItem>(
      `
      SELECT 
        i.id, i.invoiceNumber, i.jobId, i.issuedDate, i.dueDate, i.status, i.totalAmount,
        j.title as jobTitle, j.clientId,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM invoices i
      JOIN jobs j ON i.jobId = j.id
      JOIN clients c ON j.clientId = c.id
      JOIN vehicles v ON j.vehicleId = v.id
      WHERE j.clientId = ?
      ORDER BY i.issuedDate DESC
    `,
      clientId
    );
  };

  /**
   * Get invoice by ID
   */
  const getById = async (id: string): Promise<Invoice | null> => {
    const invoice = await db.getFirstAsync<Invoice>(
      `
      SELECT * FROM invoices 
      WHERE id = ?
    `,
      id
    );

    return invoice || null;
  };

  /**
   * Get invoice with details
   */
  const getInvoiceWithDetails = async (id: string): Promise<InvoiceListItem | null> => {
    const invoice = await db.getFirstAsync<InvoiceListItem>(
      `
      SELECT 
        i.id, i.invoiceNumber, i.jobId, i.issuedDate, i.dueDate, i.status, i.totalAmount,
        j.title as jobTitle, j.clientId,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM invoices i
      JOIN jobs j ON i.jobId = j.id
      JOIN clients c ON j.clientId = c.id
      JOIN vehicles v ON j.vehicleId = v.id
      WHERE i.id = ?
    `,
      id
    );

    return invoice || null;
  };

  /**
   * Get invoice by job ID
   */
  const getByJobId = async (jobId: string): Promise<Invoice | null> => {
    const invoice = await db.getFirstAsync<Invoice>(
      `
      SELECT * FROM invoices 
      WHERE jobId = ?
    `,
      jobId
    );

    return invoice || null;
  };

  /**
   * Get all payments for an invoice
   */
  const getInvoicePayments = async (invoiceId: string): Promise<Payment[]> => {
    return db.getAllAsync<Payment>(
      `
      SELECT * FROM payments
      WHERE invoiceId = ?
      ORDER BY paymentDate DESC
    `,
      invoiceId
    );
  };

  /**
   * Generate an invoice number
   * Format: INV-YYYYMMDD-XXXX where XXXX is a sequential number
   */
  const generateInvoiceNumber = async (): Promise<string> => {
    const date = new Date();
    const dateString =
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0');

    // Get the last invoice number used today
    const lastInvoice = await db.getFirstAsync<{ invoiceNumber: string }>(
      `
      SELECT invoiceNumber
      FROM invoices
      WHERE invoiceNumber LIKE ?
      ORDER BY invoiceNumber DESC
      LIMIT 1
    `,
      `INV-${dateString}-%`
    );

    let sequenceNumber = 1;
    if (lastInvoice) {
      // Extract the sequence number from the last invoice number
      const parts = lastInvoice.invoiceNumber.split('-');
      if (parts.length === 3) {
        sequenceNumber = parseInt(parts[2], 10) + 1;
      }
    }

    return `INV-${dateString}-${sequenceNumber.toString().padStart(4, '0')}`;
  };

  /**
   * Create a new invoice
   */
  const create = async (input: InvoiceInput): Promise<Invoice> => {
    const now = new Date().toISOString();
    const id = uuidv4();

    const invoice: Invoice = {
      id,
      jobId: input.jobId,
      invoiceNumber: input.invoiceNumber,
      issuedDate: input.issuedDate,
      dueDate: input.dueDate,
      status: input.status,
      subtotal: input.subtotal,
      taxRate: input.taxRate,
      taxAmount: input.taxAmount,
      discountAmount: input.discountAmount,
      totalAmount: input.totalAmount,
      notes: input.notes,
      termsAndConditions: input.termsAndConditions,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `
          INSERT INTO invoices (
            id, jobId, invoiceNumber, issuedDate, dueDate, status,
            subtotal, taxRate, taxAmount, discountAmount, totalAmount,
            notes, termsAndConditions, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          invoice.id,
          invoice.jobId,
          invoice.invoiceNumber,
          invoice.issuedDate,
          invoice.dueDate,
          invoice.status,
          invoice.subtotal,
          invoice.taxRate,
          invoice.taxAmount,
          invoice.discountAmount,
          invoice.totalAmount,
          invoice.notes || null,
          invoice.termsAndConditions || null,
          invoice.createdAt,
          invoice.updatedAt
        );

        // Also update the job with the invoice number and status
        await db.runAsync(
          `
          UPDATE jobs 
          SET 
            invoiceNumber = ?,
            status = 'invoiced',
            updatedAt = ?
          WHERE id = ?
        `,
          invoice.invoiceNumber,
          now,
          invoice.jobId
        );
      });

      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  };

  /**
   * Update an existing invoice
   */
  const update = async (id: string, input: InvoiceInput): Promise<Invoice> => {
    // First check if invoice exists
    const existingInvoice = await getById(id);
    if (!existingInvoice) {
      throw new Error(`Invoice with ID ${id} not found`);
    }

    const now = new Date().toISOString();

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `
          UPDATE invoices 
          SET 
            jobId = ?, 
            invoiceNumber = ?, 
            issuedDate = ?, 
            dueDate = ?, 
            status = ?,
            subtotal = ?, 
            taxRate = ?, 
            taxAmount = ?, 
            discountAmount = ?, 
            totalAmount = ?,
            notes = ?, 
            termsAndConditions = ?,
            updatedAt = ?
          WHERE id = ?
        `,
          input.jobId,
          input.invoiceNumber,
          input.issuedDate,
          input.dueDate,
          input.status,
          input.subtotal,
          input.taxRate,
          input.taxAmount,
          input.discountAmount,
          input.totalAmount,
          input.notes || null,
          input.termsAndConditions || null,
          now,
          id
        );

        // If status changed to paid, update the job status too
        if (input.status === 'paid') {
          await db.runAsync(
            `
            UPDATE jobs 
            SET 
              status = 'paid',
              paymentStatus = 'paid',
              updatedAt = ?
            WHERE id = ?
          `,
            now,
            input.jobId
          );
        } else if (input.status === 'partial') {
          await db.runAsync(
            `
            UPDATE jobs 
            SET 
              paymentStatus = 'partial',
              updatedAt = ?
            WHERE id = ?
          `,
            now,
            input.jobId
          );
        }
      });

      // Return the updated invoice
      const updatedInvoice = await getById(id);
      if (!updatedInvoice) {
        throw new Error('Failed to retrieve updated invoice');
      }

      return updatedInvoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };

  /**
   * Delete an invoice by ID
   */
  const deleteInvoice = async (id: string): Promise<boolean> => {
    try {
      const invoice = await getById(id);
      if (!invoice) {
        return false;
      }

      await db.withTransactionAsync(async () => {
        // Delete related payments first
        await db.runAsync('DELETE FROM payments WHERE invoiceId = ?', id);

        // Delete the invoice
        await db.runAsync('DELETE FROM invoices WHERE id = ?', id);

        // Update the job to remove invoice reference
        await db.runAsync(
          `
          UPDATE jobs 
          SET 
            invoiceNumber = NULL,
            status = 'completed',
            updatedAt = ?
          WHERE id = ? AND status = 'invoiced'
        `,
          new Date().toISOString(),
          invoice.jobId
        );
      });

      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  };

  /**
   * Add a payment to an invoice
   */
  const addPayment = async (input: PaymentInput): Promise<Payment> => {
    const now = new Date().toISOString();
    const id = uuidv4();

    const payment: Payment = {
      id,
      invoiceId: input.invoiceId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paymentDate: input.paymentDate,
      notes: input.notes,
      createdAt: now,
    };

    try {
      await db.withTransactionAsync(async () => {
        // Insert the payment
        await db.runAsync(
          `
          INSERT INTO payments (
            id, invoiceId, amount, paymentMethod, paymentDate, notes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          payment.id,
          payment.invoiceId,
          payment.amount,
          payment.paymentMethod,
          payment.paymentDate,
          payment.notes || null,
          payment.createdAt
        );

        // Get the invoice
        const invoice = await getById(input.invoiceId);
        if (!invoice) {
          throw new Error('Invoice not found');
        }

        // Get total payments for this invoice
        const result = await db.getFirstAsync<{ totalPaid: number }>(
          `
          SELECT SUM(amount) as totalPaid
          FROM payments
          WHERE invoiceId = ?
        `,
          input.invoiceId
        );

        const totalPaid = result?.totalPaid || 0;

        // Update invoice status based on payment amount
        let newStatus: 'paid' | 'partial' | 'issued' = 'issued';
        if (totalPaid >= invoice.totalAmount) {
          newStatus = 'paid';
        } else if (totalPaid > 0) {
          newStatus = 'partial';
        }

        // Update the invoice status
        await db.runAsync(
          `
          UPDATE invoices 
          SET 
            status = ?,
            updatedAt = ?
          WHERE id = ?
        `,
          newStatus,
          now,
          input.invoiceId
        );

        // Also update the job payment status
        await db.runAsync(
          `
          UPDATE jobs 
          SET 
            paymentStatus = ?,
            paymentMethod = ?,
            status = ?,
            updatedAt = ?
          WHERE id = ?
        `,
          newStatus,
          input.paymentMethod,
          newStatus === 'paid' ? 'paid' : 'invoiced',
          now,
          invoice.jobId
        );
      });

      return payment;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  };

  /**
   * Delete a payment
   */
  const deletePayment = async (paymentId: string): Promise<boolean> => {
    try {
      // Get payment details first
      const payment = await db.getFirstAsync<Payment>(
        'SELECT * FROM payments WHERE id = ?',
        paymentId
      );

      if (!payment) {
        return false;
      }

      await db.withTransactionAsync(async () => {
        // Delete the payment
        await db.runAsync('DELETE FROM payments WHERE id = ?', paymentId);

        // Recalculate invoice status
        const result = await db.getFirstAsync<{ totalPaid: number }>(
          `
          SELECT SUM(amount) as totalPaid
          FROM payments
          WHERE invoiceId = ?
        `,
          payment.invoiceId
        );

        const totalPaid = result?.totalPaid || 0;

        // Get invoice details
        const invoice = await getById(payment.invoiceId);
        if (!invoice) {
          throw new Error('Invoice not found');
        }

        // Update invoice status based on remaining payments
        let newStatus: 'paid' | 'partial' | 'issued' = 'issued';
        if (totalPaid >= invoice.totalAmount) {
          newStatus = 'paid';
        } else if (totalPaid > 0) {
          newStatus = 'partial';
        }

        // Update the invoice status
        await db.runAsync(
          `
          UPDATE invoices 
          SET 
            status = ?,
            updatedAt = ?
          WHERE id = ?
        `,
          newStatus,
          new Date().toISOString(),
          payment.invoiceId
        );

        // Also update the job payment status
        await db.runAsync(
          `
          UPDATE jobs 
          SET 
            paymentStatus = ?,
            status = ?,
            updatedAt = ?
          WHERE id = ?
        `,
          newStatus,
          newStatus === 'paid' ? 'paid' : 'invoiced',
          new Date().toISOString(),
          invoice.jobId
        );
      });

      return true;
    } catch (error) {
      console.error('Error deleting payment:', error);
      return false;
    }
  };

  /**
   * Get count of invoices
   */
  const getCount = async (): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM invoices'
    );
    return result?.count || 0;
  };

  /**
   * Get count of overdue invoices
   */
  const getOverdueCount = async (): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.getFirstAsync<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM invoices 
      WHERE status IN ('issued', 'partial') AND dueDate < ?
    `,
      today
    );
    return result?.count || 0;
  };

  /**
   * Mark overdue invoices
   * This should be called periodically to update the status of overdue invoices
   */
  const markOverdueInvoices = async (): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const result = await db.runAsync(
      `
      UPDATE invoices 
      SET 
        status = 'overdue',
        updatedAt = ?
      WHERE status IN ('issued', 'partial') AND dueDate < ?
    `,
      now,
      today
    );

    return result.changes;
  };

  return {
    getAll,
    getByClientId,
    getById,
    getInvoiceWithDetails,
    getByJobId,
    getInvoicePayments,
    generateInvoiceNumber,
    create,
    update,
    delete: deleteInvoice,
    addPayment,
    deletePayment,
    getCount,
    getOverdueCount,
    markOverdueInvoices,
  };
}
