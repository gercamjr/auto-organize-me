// src/__tests__/hooks/useClientRepository.test.ts
import { useClientRepository } from '../../hooks/useClientRepository';
import { useSQLiteContext } from 'expo-sqlite';
import { renderHook, act } from '@testing-library/react-hooks';

// Mock the hooks
jest.mock('../../hooks/useClientRepository', () => ({
  useClientRepository: jest.fn(),
}));
jest.mock('expo-sqlite', () => ({
  useSQLiteContext: jest.fn(),
}));

describe('useClientRepository', () => {
  const mockDB = {
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    runAsync: jest.fn(),
    withTransactionAsync: jest.fn(async (callback) => await callback()),
  };

  const mockUseClientRepository = {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getClientVehicles: jest.fn(),
    getClientJobCount: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSQLiteContext as jest.Mock).mockReturnValue(mockDB);
    (useClientRepository as jest.Mock).mockReturnValue(mockUseClientRepository);
  });

  it('should get all clients', async () => {
    const mockClients = [
      { id: '1', firstName: 'John', lastName: 'Doe', phoneNumber: '555-1234' },
      { id: '2', firstName: 'Jane', lastName: 'Smith', phoneNumber: '555-5678' },
    ];
    mockUseClientRepository.getAll.mockResolvedValue(mockClients);

    const { result } = renderHook(() => useClientRepository());
    let clients;
    await act(async () => {
      clients = await result.current.getAll();
    });

    expect(mockUseClientRepository.getAll).toHaveBeenCalledTimes(1);
    expect(clients).toEqual(mockClients);
  });

  it('should get a client by ID', async () => {
    const mockClient = { id: '1', firstName: 'John', lastName: 'Doe', phoneNumber: '555-1234' };
    mockUseClientRepository.getById.mockResolvedValue(mockClient);

    const { result } = renderHook(() => useClientRepository());
    let client;
    await act(async () => {
      client = await result.current.getById('1');
    });

    expect(mockUseClientRepository.getById).toHaveBeenCalledTimes(1);
    expect(client).toEqual(mockClient);
  });

  it('should create a new client', async () => {
    const clientInput = {
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '555-1234',
      email: 'john@example.com',
    };
    const createdClient = {
      ...clientInput,
      id: '1',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    };
    mockUseClientRepository.create.mockResolvedValue(createdClient);

    const { result } = renderHook(() => useClientRepository());
    let client;
    await act(async () => {
      client = await result.current.create(clientInput);
    });

    expect(mockUseClientRepository.create).toHaveBeenCalledTimes(1);
    expect(client).toEqual(createdClient);
  });

  it('should update an existing client', async () => {
    const updatedClient = {
      id: '1',
      firstName: 'Johnny',
      lastName: 'Doe',
      phoneNumber: '555-1234',
    };
    mockUseClientRepository.update.mockResolvedValue(updatedClient);

    const { result } = renderHook(() => useClientRepository());
    let client;
    await act(async () => {
      client = await result.current.update('1', updatedClient);
    });

    expect(mockUseClientRepository.update).toHaveBeenCalledTimes(1);
    expect(client).toEqual(updatedClient);
  });

  it('should delete a client', async () => {
    mockUseClientRepository.delete.mockResolvedValue(true);

    const { result } = renderHook(() => useClientRepository());
    let success;
    await act(async () => {
      success = await result.current.delete('1');
    });

    expect(mockUseClientRepository.delete).toHaveBeenCalledTimes(1);
    expect(success).toBe(true);
  });

  it('should get client vehicles', async () => {
    const mockVehicles = [
      { id: '1', make: 'Toyota', model: 'Camry', year: 2020 },
      { id: '2', make: 'Honda', model: 'Civic', year: 2019 },
    ];
    mockUseClientRepository.getClientVehicles.mockResolvedValue(mockVehicles);

    const { result } = renderHook(() => useClientRepository());
    let vehicles;
    await act(async () => {
      vehicles = await result.current.getClientVehicles('1');
    });

    expect(mockUseClientRepository.getClientVehicles).toHaveBeenCalledTimes(1);
    expect(vehicles).toEqual(mockVehicles);
  });

  it('should get client job count', async () => {
    mockUseClientRepository.getClientJobCount.mockResolvedValue(5);

    const { result } = renderHook(() => useClientRepository());
    let count;
    await act(async () => {
      count = await result.current.getClientJobCount('1');
    });

    expect(mockUseClientRepository.getClientJobCount).toHaveBeenCalledTimes(1);
    expect(count).toBe(5);
  });
});
