import { Text, View, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home screen</Text>
      <Link href='/clients' style={styles.button}>
        View Clients <Ionicons name='people' size={24} />
      </Link>
      <Link href='/vehicles' style={styles.button}>
        View Vehicles <Ionicons name='car' size={24} />
      </Link>
      <Link href='/jobs' style={styles.button}>
        View Jobs <Ionicons name='briefcase' size={24} />
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
})
