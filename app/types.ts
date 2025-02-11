// create interface for clients
export interface Clients {
  id: number
  name: string
  address: string
  phonenumber: string
  created: string
  updated: string
}

// create interface for vehicles
export interface Vehicles {
  id: number
  client_id: number
  make: string
  model: string
  year: string
  color: string
  photos: string[]
  created: string
  updated: string
}

// create interface for jobs
export interface Jobs {
  id: number
  vehicle_id: number
  client_id: number
  description: string
  cost: number
  photos: string[]
  created: string
  updated: string
}
