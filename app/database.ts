import * as SQLite from 'expo-sqlite'

export const db = await SQLite.openDatabaseAsync('auto-organize-me.db')

export default db
