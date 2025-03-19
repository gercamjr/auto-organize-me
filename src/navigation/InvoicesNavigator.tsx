import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';

// Import screens
import InvoiceListScreen from '../screens/invoice/InvoiceListScreen';
import InvoiceDetailsScreen from '../screens/invoice/InvoiceDetailsScreen';
import GenerateInvoiceScreen from '../screens/invoice/GenerateInvoiceScreen';
import RecordPaymentScreen from '../screens/invoice/RecordPaymentScreen';
import EditInvoiceScreen from '../screens/invoice/EditInvoiceScreen';

// Define the invoices stack parameter list
export type InvoicesStackParamList = {
  InvoiceList: undefined;
  InvoiceDetails: { invoiceId: string };
  GenerateInvoice: { jobId: string };
  RecordPayment: { invoiceId: string; remainingBalance: number };
  EditInvoice: { invoiceId: string };
};

const Stack = createStackNavigator<InvoicesStackParamList>();

/**
 * Invoices navigator containing all invoice-related screens
 */
const InvoicesNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="InvoiceList"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="InvoiceList"
        component={InvoiceListScreen}
        options={{
          title: 'Invoices',
        }}
      />
      <Stack.Screen
        name="InvoiceDetails"
        component={InvoiceDetailsScreen}
        options={{
          title: 'Invoice Details',
        }}
      />
      <Stack.Screen
        name="GenerateInvoice"
        component={GenerateInvoiceScreen}
        options={{
          title: 'Generate Invoice',
        }}
      />
      <Stack.Screen
        name="RecordPayment"
        component={RecordPaymentScreen}
        options={{
          title: 'Record Payment',
        }}
      />
      <Stack.Screen
        name="EditInvoice"
        component={EditInvoiceScreen}
        options={{
          title: 'Edit Invoice',
        }}
      />
    </Stack.Navigator>
  );
};

export default InvoicesNavigator;
