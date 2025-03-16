import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import {
  Text,
  Searchbar,
  Card,
  Chip,
  Divider,
  ActivityIndicator,
  Button,
  Menu,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { InvoicesStackParamList } from '../../navigation/InvoicesNavigator';
import { useInvoiceRepository, InvoiceListItem } from '../../hooks/useInvoiceRepository';
import { spacing, shadows } from '../../utils/theme';
import { format, isAfter, parseISO } from 'date-fns';

// Define the navigation prop type
type InvoiceListScreenNavigationProp = StackNavigationProp<InvoicesStackParamList, 'InvoiceList'>;

const InvoiceListScreen: React.FC = () => {
  const navigation = useNavigation<InvoiceListScreenNavigationProp>();
  const invoiceRepository = useInvoiceRepository();

  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Load invoices from database
  const loadInvoices = async () => {
    try {
      setError(null);

      // Mark overdue invoices first
      await invoiceRepository.markOverdueInvoices();

      // Then get all invoices
      const result = await invoiceRepository.getAll();

      setInvoices(result);
      applyFilter(result, activeFilter);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadInvoices();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      applyFilter(invoices, activeFilter);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(lowercaseQuery) ||
        invoice.clientName.toLowerCase().includes(lowercaseQuery) ||
        invoice.vehicleInfo.toLowerCase().includes(lowercaseQuery) ||
        invoice.jobTitle.toLowerCase().includes(lowercaseQuery)
    );

    setFilteredInvoices(filtered);
  };

  // Apply filters
  const applyFilter = (invoicesList: InvoiceListItem[], filter: string) => {
    let filtered = [...invoicesList];

    switch (filter) {
      case 'draft':
      case 'issued':
      case 'paid':
      case 'partial':
      case 'overdue':
      case 'canceled':
        filtered = invoicesList.filter((invoice) => invoice.status === filter);
        break;
      case 'unpaid':
        filtered = invoicesList.filter(
          (invoice) =>
            invoice.status === 'issued' ||
            invoice.status === 'partial' ||
            invoice.status === 'overdue'
        );
        break;
      case 'due-soon':
        const today = new Date();
        const inSevenDays = new Date();
        inSevenDays.setDate(today.getDate() + 7);

        filtered = invoicesList.filter(
          (invoice) =>
            (invoice.status === 'issued' || invoice.status === 'partial') &&
            isAfter(parseISO(invoice.dueDate), today) &&
            !isAfter(parseISO(invoice.dueDate), inSevenDays)
        );
        break;
      case 'all':
      default:
        // Keep all invoices
        break;
    }

    setFilteredInvoices(filtered);
    setActiveFilter(filter);
    setFilterMenuVisible(false);
  };

  // Handle filter selection
  const handleFilterSelect = (filter: string) => {
    applyFilter(invoices, filter);
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  // Navigate to invoice details
  const handleInvoicePress = (invoiceId: string) => {
    navigation.navigate('InvoiceDetails', { invoiceId });
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (err) {
      return 'Invalid date';
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

  // Render each invoice item
  const renderItem = ({ item }: { item: InvoiceListItem }) => {
    return (
      <TouchableOpacity onPress={() => handleInvoicePress(item.id)}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceNumber}>Invoice #{item.invoiceNumber}</Text>
                <Text style={styles.clientName}>{item.clientName}</Text>
                <Text style={styles.jobTitle}>{item.jobTitle}</Text>
              </View>
              <Chip
                mode="outlined"
                textStyle={{ color: getStatusColor(item.status) }}
                style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailsRow}>
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Issued:</Text>
                <Text style={styles.dateValue}>{formatDate(item.issuedDate)}</Text>
              </View>
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Due:</Text>
                <Text style={styles.dateValue}>{formatDate(item.dueDate)}</Text>
              </View>
              <Text style={styles.amountText}>{formatCurrency(item.totalAmount)}</Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleLarge" style={styles.emptyTitle}>
        No Invoices Found
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {searchQuery
          ? 'Try different search terms or filters'
          : activeFilter !== 'all'
            ? 'Try a different filter'
            : 'Create invoices from completed jobs'}
      </Text>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading invoices...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium" style={styles.errorText}>
          {error}
        </Text>
        <Button
          mode="contained"
          onPress={() => {
            setError(null);
            setIsLoading(true);
            loadInvoices();
          }}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search invoices..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFilterMenuVisible(true)}
            >
              <View style={styles.filterButtonContent}>
                <Text style={styles.filterButtonText}>
                  {activeFilter === 'all'
                    ? 'All Invoices'
                    : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                </Text>
                <IconButton icon="filter-variant" size={20} />
              </View>
            </TouchableOpacity>
          }
        >
          <Menu.Item onPress={() => handleFilterSelect('all')} title="All Invoices" />
          <Menu.Item onPress={() => handleFilterSelect('draft')} title="Drafts" />
          <Menu.Item onPress={() => handleFilterSelect('issued')} title="Issued" />
          <Menu.Item onPress={() => handleFilterSelect('paid')} title="Paid" />
          <Menu.Item onPress={() => handleFilterSelect('partial')} title="Partially Paid" />
          <Menu.Item onPress={() => handleFilterSelect('overdue')} title="Overdue" />
          <Menu.Item onPress={() => handleFilterSelect('unpaid')} title="All Unpaid" />
          <Menu.Item onPress={() => handleFilterSelect('due-soon')} title="Due Soon" />
          <Menu.Item onPress={() => handleFilterSelect('canceled')} title="Canceled" />
        </Menu>
      </View>

      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: 'white',
    ...shadows.small,
  },
  searchBar: {
    flex: 1,
    marginRight: spacing.sm,
    elevation: 0,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: spacing.xs,
    paddingRight: 0,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    marginLeft: spacing.xs,
  },
  listContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  clientName: {
    color: '#555',
  },
  jobTitle: {
    color: '#666',
    fontSize: 14,
  },
  statusChip: {
    borderWidth: 1,
    height: 28,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
  },
  dateValue: {
    fontSize: 14,
  },
  amountText: {
    fontWeight: 'bold',
    fontSize: 16,
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
    color: 'red',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  emptyTitle: {
    marginBottom: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: '#757575',
    paddingHorizontal: spacing.lg,
  },
});

export default InvoiceListScreen;
