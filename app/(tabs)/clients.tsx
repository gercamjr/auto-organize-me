import React, { useEffect, useState } from 'react'
import { Text, View, StyleSheet, FlatList, Button } from 'react-native'
import { getClients, addClient } from '../dbOperations'
import { Clients } from '../types'
import { Link } from 'expo-router'

export default function ClientsScreen() {
  const [clients, setClients] = useState<Clients[]>([])

  useEffect(() => {
    fetchClients()
  })

  async function fetchClients() {
    const clients: Clients[] = await getClients()
    setClients(clients)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Clients</Text>
      <Link href='/add-client' style={styles.button}>
        Add Client
      </Link>
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/client/:id', params: { id: item.id } }}>
            <View style={styles.clientItem}>
              <Text style={styles.text}>{item.name}</Text> <Text style={styles.text}>{item.address}</Text>
            </View>
          </Link>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
  clientItem: {
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
})
