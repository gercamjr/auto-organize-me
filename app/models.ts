import db from './database'

export const createTables = () => {
  db.withTransactionAsync(async () => {
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phonenumber TEXT NOT NULL,
        created DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    )
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        color TEXT NOT NULL,
        photos TEXT[],
        created DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        client_id INTEGER,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      );`
    )
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        cost REAL NOT NULL,
        photos TEXT[],
        created DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        client_id INTEGER,
        vehicle_id INTEGER,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
      );`
    )
  })
}
