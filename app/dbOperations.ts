import db from './database'

export interface Clients {
  id: number
  name: string
  address: string
  phonenumber: string
  created: string
  updated: string
}

// get clients
export const getClients = async (): Promise<Clients[]> => {
  const results: Clients[] = await db.getAllAsync('SELECT * FROM clients ORDER BY created DESC')
  return results
}

// get client by id and include vehicles
export const getClientByIdAndVehicles = async (id: number): Promise<Clients[] | null> => {
  const results: Clients[] = await db.getAllAsync(
    'SELECT * FROM clients, vehicles WHERE id = $clientid INNER JOIN AS vehicles ON clients.id = vehicles.client_id',
    { clientid: id }
  )
  if (results.length > 0) {
    return results
  }
  return null
}

// add client
export const addClient = async (name: string, address: string, phonenumber: string): Promise<number | null> => {
  const results = await db.runAsync(
    'INSERT INTO clients (name, address, phonenumber) VALUES ($name, $address, $phonenumber)',
    {
      name: name,
      address: address,
      phonenumber: phonenumber,
    }
  )
  if (results.lastInsertRowId) {
    return results.lastInsertRowId
  }
  return null
}

// delete client
export const deleteClient = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM clients WHERE id = ?', [id])
}

// update client
export const updateClient = async (id: number, name: string, address: string, phonenumber: string): Promise<void> => {
  await db.runAsync('UPDATE clients SET name = ?, address = ?, phonenumber = ? WHERE id = ?', [
    name,
    address,
    phonenumber,
    id,
  ])
}
