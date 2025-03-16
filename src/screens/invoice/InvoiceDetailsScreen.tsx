import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl, Share } from 'react-native';
import {
  Text,
  Button,
  Divider,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  IconButton,
  Chip,
  DataTable,
  Menu,
  FAB,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { spacing, shadows } from '../../utils/theme';
import { useInvoiceRepository, Payment } from '../../hooks/useInvoiceRepository';
import { useJobRepository } from '../../hooks/useJobRepository';
import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Define types for the screen
type InvoiceDetailsScreenNavigationProp = StackNavigationProp<any, 'InvoiceDetails'>;
type InvoiceDetailsScreenRouteProp = RouteProp<any, 'InvoiceDetails'>;

const InvoiceDetailsScreen: React.FC = () => {
  const invoiceRepository = useInvoiceRepository();
  const jobRepository = useJobRepository();
  const navigation = useNavigation<InvoiceDetailsScreenNavigationProp>();
  const route = useRoute<InvoiceDetailsScreenRouteProp>();
  const { invoiceId } = route.params || {};

  const [invoice, setInvoice] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [labor, setLabor] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [totalPaid, setTotalPaid] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);

  // Load invoice data
  const loadInvoiceData = async () => {
    try {
      setError(null);

      // Get invoice details
      const invoiceData = await invoiceRepository.getById(invoiceId);
      if (!invoiceData) {
        setError('Invoice not found');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      // Get invoice with client and vehicle details
      const invoiceWithDetails = await invoiceRepository.getInvoiceWithDetails(invoiceId);
      setInvoice(invoiceWithDetails);

      // Get job details
      const jobData = await jobRepository.getById(invoiceData.jobId);
      setJob(jobData);

      // Get parts and labor
      const jobParts = await jobRepository.getJobParts(invoiceData.jobId);
      const jobLabor = await jobRepository.getJobLaborEntries(invoiceData.jobId);
      setParts(jobParts);
      setLabor(jobLabor);

      // Get payments
      const invoicePayments = await invoiceRepository.getInvoicePayments(invoiceId);
      setPayments(invoicePayments);

      // Calculate total paid and balance
      const paid = invoicePayments.reduce((sum, payment) => sum + payment.amount, 0);
      setTotalPaid(paid);
      setBalanceDue(invoiceWithDetails ? invoiceWithDetails.totalAmount - paid : 0);
    } catch (err) {
      console.error('Error loading invoice data:', err);
      setError('Failed to load invoice data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    if (!invoiceId) {
      setError('No invoice selected');
      setIsLoading(false);
      return;
    }

    loadInvoiceData();
  }, [invoiceId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadInvoiceData();
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (err) {
      return '';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#757575'; // Grey
      case 'issued':
        return '#2196F3'; // Blue
      case 'paid':
        return '#4CAF50'; // Green
      case 'partial':
        return '#FF9800'; // Orange
      case 'overdue':
        return '#F44336'; // Red
      case 'canceled':
        return '#9E9E9E'; // Grey
      default:
        return '#757575'; // Grey
    }
  };

  // Delete invoice
  const handleDeleteInvoice = () => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await invoiceRepository.delete(invoiceId);
              Alert.alert('Success', 'Invoice deleted successfully');
              navigation.goBack();
            } catch (err) {
              console.error('Error deleting invoice:', err);
              Alert.alert('Error', 'Failed to delete invoice');
            }
          },
        },
      ]
    );
  };

  // Record payment
  const handleRecordPayment = () => {
    navigation.navigate('RecordPayment', { invoiceId, remainingBalance: balanceDue });
  };

  // Generate PDF invoice
  const generatePDF = async () => {
    if (!invoice) return;

    try {
      // Create HTML content for the invoice
      const html = `
        <html>
          <head>
            <style>
              body {
                font-family: 'Helvetica', sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
              }
              .invoice-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
              }
              .company-info {
                text-align: left;
              }
              .invoice-info {
                text-align: right;
              }
              .invoice-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
                color: #1976D2;
              }
              .client-info {
                margin-bottom: 30px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              th {
                background-color: #f0f0f0;
                text-align: left;
                padding: 10px;
                border-bottom: 2px solid #ddd;
              }
              td {
                padding: 10px;
                border-bottom: 1px solid #ddd;
              }
              .total-row {
                font-weight: bold;
              }
              .subtotal-section {
                margin-top: 20px;
                text-align: right;
              }
              .notes-section {
                margin-top: 30px;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
              .payment-section {
                margin-top: 30px;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
              .terms-section {
                margin-top: 30px;
                border-top: 1px solid #ddd;
                padding-top: 20px;
                font-size: 12px;
              }
              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <div class="company-info">
                <div class="invoice-title">Auto Organize Me</div>
                <div>123 Mechanic Street</div>
                <div>Autoville, CA 90210</div>
                <div>Phone: (555) 123-4567</div>
                <div>Email: service@autoorganizeme.com</div>
              </div>
              <div class="invoice-info">
                <div class="invoice-title">INVOICE</div>
                <div>Invoice #: ${invoice.invoiceNumber}</div>
                <div>Date: ${formatDate(invoice.issuedDate)}</div>
                <div>Due Date: ${formatDate(invoice.dueDate)}</div>
                <div>Status: ${invoice.status}</div>
              </div>
            </div>

            <div class="client-info">
              <h3>Bill To:</h3>
              <div>${invoice.clientName}</div>
              <div>${job?.locationAddress || 'No address provided'}</div>
            </div>

            <div>
              <h3>Job Details:</h3>
              <div>${job?.title}</div>
              <div>Vehicle: ${invoice.vehicleInfo}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${parts
                  .map(
                    (part) => `
                  <tr>
                    <td>Part</td>
                    <td>${part.name}</td>
                    <td>${part.quantity}</td>
                    <td>$${part.clientPrice.toFixed(2)}</td>
                    <td>$${part.totalCost.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join('')}
                
                ${labor
                  .map(
                    (item) => `
                  <tr>
                    <td>Labor</td>
                    <td>${item.description}</td>
                    <td>${item.hours} hrs</td>
                    <td>$${item.rate.toFixed(2)}/hr</td>
                    <td>$${item.totalCost.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <div class="subtotal-section">
              <div>Subtotal: $${invoice.subtotal.toFixed(2)}</div>
              <div>Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}</div>
              ${invoice.discountAmount > 0 ? `<div>Discount: -$${invoice.discountAmount.toFixed(2)}</div>` : ''}
              <div style="font-weight: bold; font-size: 18px; margin-top: 10px;">
                Total: $${invoice.totalAmount.toFixed(2)}
              </div>
              
              ${
                totalPaid > 0
                  ? `
                <div style="margin-top: 10px;">Amount Paid: $${totalPaid.toFixed(2)}</div>
                <div style="font-weight: bold;">Balance Due: $${balanceDue.toFixed(2)}</div>
              `
                  : ''
              }
            </div>

            ${
              invoice.notes
                ? `
              <div class="notes-section">
                <h3>Notes:</h3>
                <p>${invoice.notes}</p>
              </div>
            `
                : ''
            }

            <div class="terms-section">
              <h3>Terms and Conditions:</h3>
              <p>${invoice.termsAndConditions || 'No terms specified.'}</p>
            </div>

            <div class="footer">
              <p>Thank you for your business!</p>
            </div>
          </body>
        </html>
      `;

      // Generate the PDF
      const { uri } = await Print.printToFileAsync({ html });

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      Alert.alert('Error', 'Failed to generate invoice PDF');
    }
  };

  // Send invoice via email
  const sendInvoice = async () => {
    try {
      // First generate the PDF
      await generatePDF();

      // Email functionality would typically be handled by a backend service
      // For now, we'll just show a message
      Alert.alert(
        'Success',
        'The invoice PDF has been generated. You can manually send it via email.'
      );
    } catch (err) {
      console.error('Error sending invoice:', err);
      Alert.alert('Error', 'Failed to send invoice');
    }
  };

  // Mark invoice as paid
  const markAsPaid = async () => {
    if (!invoice) return;

    Alert.alert('Mark as Paid', 'Are you sure you want to mark this invoice as fully paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            // Add a payment for the remaining balance
            if (balanceDue > 0) {
              await invoiceRepository.addPayment({
                invoiceId,
                amount: balanceDue,
                paymentMethod: 'Other',
                paymentDate: new Date().toISOString(),
                notes: 'Marked as paid manually',
              });
            }

            // Update invoice status
            await invoiceRepository.update(invoiceId, {
              ...invoice,
              status: 'paid',
            });

            // Refresh data
            await loadInvoiceData();

            Alert.alert('Success', 'Invoice marked as paid successfully');
          } catch (err) {
            console.error('Error marking invoice as paid:', err);
            Alert.alert('Error', 'Failed to mark invoice as paid');
          }
        },
      },
    ]);
  };

  // Handle action menu
  const handleMenuAction = (action: string) => {
    setMenuVisible(false);

    switch (action) {
      case 'edit':
        // Navigate to edit invoice
        navigation.navigate('EditInvoice', { invoiceId });
        break;
      case 'delete':
        handleDeleteInvoice();
        break;
      case 'pdf':
        generatePDF();
        break;
      case 'email':
        sendInvoice();
        break;
      case 'paid':
        markAsPaid();
        break;
      default:
        break;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading invoice details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !invoice) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Invoice not found'}</Text>
        <Button mode="contained" onPress={handleRefresh}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <IconButton
            icon="dots-vertical"
            size={24}
            onPress={() => setMenuVisible(true)}
            style={styles.menuButton}
          />
        }
      >
        {invoice.status === 'draft' && (
          <Menu.Item onPress={() => handleMenuAction('edit')} title="Edit Invoice" />
        )}
        <Menu.Item onPress={() => handleMenuAction('pdf')} title="Generate PDF" />
        <Menu.Item onPress={() => handleMenuAction('email')} title="Send via Email" />
        {(invoice.status === 'issued' ||
          invoice.status === 'partial' ||
          invoice.status === 'overdue') && (
          <Menu.Item onPress={() => handleMenuAction('paid')} title="Mark as Paid" />
        )}
        <Menu.Item onPress={() => handleMenuAction('delete')} title="Delete Invoice" />
      </Menu>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Invoice Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View>
                <Title style={styles.invoiceNumber}>Invoice #{invoice.invoiceNumber}</Title>
                <Text style={styles.jobTitle}>{invoice.jobTitle}</Text>
              </View>
              <Chip
                mode="outlined"
                textStyle={{ color: getStatusColor(invoice.status) }}
                style={[styles.statusChip, { borderColor: getStatusColor(invoice.status) }]}
              >
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Client:</Text>
                <Text style={styles.infoValue}>{invoice.clientName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Vehicle:</Text>
                <Text style={styles.infoValue}>{invoice.vehicleInfo}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Issue Date:</Text>
                <Text style={styles.infoValue}>{formatDate(invoice.issuedDate)}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Due Date:</Text>
                <Text style={styles.infoValue}>{formatDate(invoice.dueDate)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Items Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Items</Title>

            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Item</DataTable.Title>
                <DataTable.Title numeric>Qty</DataTable.Title>
                <DataTable.Title numeric>Unit Price</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>

              {parts.map((part) => (
                <DataTable.Row key={`part-${part.id}`}>
                  <DataTable.Cell>{part.name}</DataTable.Cell>
                  <DataTable.Cell numeric>{part.quantity}</DataTable.Cell>
                  <DataTable.Cell numeric>{formatCurrency(part.clientPrice)}</DataTable.Cell>
                  <DataTable.Cell numeric>{formatCurrency(part.totalCost)}</DataTable.Cell>
                </DataTable.Row>
              ))}

              {labor.map((item) => (
                <DataTable.Row key={`labor-${item.id}`}>
                  <DataTable.Cell>{item.description}</DataTable.Cell>
                  <DataTable.Cell numeric>{item.hours} hrs</DataTable.Cell>
                  <DataTable.Cell numeric>{formatCurrency(item.rate)}/hr</DataTable.Cell>
                  <DataTable.Cell numeric>{formatCurrency(item.totalCost)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>

        {/* Totals Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Summary</Title>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>

            {invoice.taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%):</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
              </View>
            )}

            {invoice.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={styles.totalValue}>-{formatCurrency(invoice.discountAmount)}</Text>
              </View>
            )}

            <Divider style={styles.totalDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.totalAmount)}</Text>
            </View>

            {totalPaid > 0 && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Amount Paid:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totalPaid)}</Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.balanceLabel}>Balance Due:</Text>
                  <Text style={styles.balanceValue}>{formatCurrency(balanceDue)}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Payments Section */}
        {payments.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Payment History</Title>

              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Date</DataTable.Title>
                  <DataTable.Title>Method</DataTable.Title>
                  <DataTable.Title numeric>Amount</DataTable.Title>
                </DataTable.Header>

                {payments.map((payment) => (
                  <DataTable.Row key={payment.id}>
                    <DataTable.Cell>{formatDate(payment.paymentDate)}</DataTable.Cell>
                    <DataTable.Cell>{payment.paymentMethod}</DataTable.Cell>
                    <DataTable.Cell numeric>{formatCurrency(payment.amount)}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card.Content>
          </Card>
        )}

        {/* Notes Section */}
        {invoice.notes && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Notes</Title>
              <Paragraph>{invoice.notes}</Paragraph>
            </Card.Content>
          </Card>
        )}

        {/* Terms and Conditions */}
        {invoice.termsAndConditions && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Terms and Conditions</Title>
              <Paragraph style={styles.termsText}>{invoice.termsAndConditions}</Paragraph>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            icon="file-pdf-box"
            onPress={generatePDF}
            style={styles.actionButton}
          >
            PDF
          </Button>

          <Button mode="contained" icon="email" onPress={sendInvoice} style={styles.actionButton}>
            Email
          </Button>
        </View>
      </ScrollView>

      {/* FAB to record payment if invoice is not fully paid */}
      {(invoice.status === 'issued' ||
        invoice.status === 'partial' ||
        invoice.status === 'overdue') && (
        <FAB
          style={styles.fab}
          icon="cash-register"
          label="Record Payment"
          onPress={handleRecordPayment}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  headerCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  card: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  jobTitle: {
    fontSize: 16,
    color: '#666',
  },
  statusChip: {
    borderWidth: 1,
  },
  divider: {
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalDivider: {
    marginVertical: spacing.sm,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  termsText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  menuButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: '#F44336',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

export default InvoiceDetailsScreen;
