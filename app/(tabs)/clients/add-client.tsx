// page that displays the form to add a new client

import { addClient } from '../../../libs/db/dbOperations'
import { useState } from 'react'
import { Href, Link } from 'expo-router'
import { Text, View, StyleSheet, TextInput, Button } from 'react-native'

export default function AddClient() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  async function handleSubmit() {
    await addClient(name, address, phoneNumber)
    setName('')
    setAddress('')
    setPhoneNumber('')
    alert('Client added successfully')
  }

  const clientsPath = '/clients' as Href

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Add Client</Text>
      <TextInput style={styles.input} placeholder='Name' onChangeText={(text) => setName(text)} />
      <TextInput style={styles.input} placeholder='Address' onChangeText={(text) => setAddress(text)} />
      <TextInput style={styles.input} placeholder='Phone Number' onChangeText={(text) => setPhoneNumber(text)} />
      <Button title='Submit' onPress={handleSubmit} />
      <Link href={clientsPath} style={styles.button}>
        Back
      </Link>
    </View>
  )
}

// styles
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
  input: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    margin: 8,
    borderRadius: 8,
    width: 200,
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
})
