import db from './database'
import { Clients, Vehicles, Jobs } from './types'

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

// get vehicles
export const getVehicles = async (): Promise<Vehicles[]> => {
  const results: Vehicles[] = await db.getAllAsync('SELECT * FROM vehicles ORDER BY created DESC')
  return results
}

// get vehicle by id and include jobs and client
export const getVehicleByIdAndJobsAndClient = async (id: number): Promise<Vehicles[] | null> => {
  const results: Vehicles[] = await db.getAllAsync(
    'SELECT * FROM vehicles, jobs, clients WHERE vehicles.id = $vehicleid INNER JOIN AS jobs ON vehicles.id = jobs.vehicle_id INNER JOIN AS clients ON vehicles.client_id = clients.id',
    { vehicleid: id }
  )
  if (results.length > 0) {
    return results
  }
  return null
}

// add vehicle
export const addVehicle = async (
  client_id: number,
  make: string,
  model: string,
  year: number,
  photos: string[]
): Promise<number | null> => {
  const results = await db.runAsync(
    'INSERT INTO vehicles (client_id, make, model, year, photos) VALUES ($client_id, $make, $model, $year, $photos)',
    {
      client_id: client_id,
      make: make,
      model: model,
      year: year,
      photos: JSON.stringify(photos),
    }
  )
  if (results.lastInsertRowId) {
    return results.lastInsertRowId
  }
  return null
}

// delete vehicle
export const deleteVehicle = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM vehicles WHERE id = ?', [id])
}

// update vehicle
export const updateVehicle = async (
  id: number,
  client_id: number,
  make: string,
  model: string,
  year: number,
  photos: string[]
): Promise<void> => {
  await db.runAsync('UPDATE vehicles SET client_id = ?, make = ?, model = ?, year = ?, photos = ? WHERE id = ?', [
    client_id,
    make,
    model,
    year,
    JSON.stringify(photos),
    id,
  ])
}

// get jobs
export const getJobs = async (): Promise<Jobs[]> => {
  const results: Jobs[] = await db.getAllAsync('SELECT * FROM jobs ORDER BY created DESC')
  return results
}

// get job by id and include vehicle and client
export const getJobByIdAndVehicleAndClient = async (id: number): Promise<Jobs[] | null> => {
  const results: Jobs[] = await db.getAllAsync(
    'SELECT * FROM jobs, vehicles, clients WHERE jobs.id = $jobid INNER JOIN AS vehicles ON jobs.vehicle_id = vehicles.id INNER JOIN AS clients ON vehicles.client_id = clients.id',
    { jobid: id }
  )
  if (results.length > 0) {
    return results
  }
  return null
}

// add job
export const addJob = async (
  vehicle_id: number,
  description: string,
  cost: number,
  photos: string[]
): Promise<number | null> => {
  const results = await db.runAsync(
    'INSERT INTO jobs (vehicle_id, description, cost) VALUES ($vehicle_id, $description, $cost, $photos)',
    {
      vehicle_id: vehicle_id,
      description: description,
      cost: cost,
      photos: JSON.stringify(photos),
    }
  )
  if (results.lastInsertRowId) {
    return results.lastInsertRowId
  }
  return null
}

// delete job
export const deleteJob = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM jobs WHERE id = ?', [id])
}

// update job
export const updateJob = async (
  id: number,
  vehicle_id: number,
  description: string,
  cost: number,
  photos: string[]
): Promise<void> => {
  await db.runAsync('UPDATE jobs SET vehicle_id = ?, description = ?, cost = ?, photos = ? WHERE id = ?', [
    vehicle_id,
    description,
    cost,
    JSON.stringify(photos),
    id,
  ])
}

// export db operations
export default {
  getClients,
  getClientByIdAndVehicles,
  addClient,
  deleteClient,
  updateClient,
  getVehicles,
  getVehicleByIdAndJobsAndClient,
  addVehicle,
  deleteVehicle,
  updateVehicle,
  getJobs,
  getJobByIdAndVehicleAndClient,
  addJob,
  deleteJob,
  updateJob,
}
