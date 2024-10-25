import { View, Text, Image } from 'react-native'
import React from 'react'

import logo from '@/assets/images/red-car-logo.png'

const App = () => {
  return (
    <View className='flex-1 justify-center items-center'>
      <Text>Auto Organize Me</Text>
      <Image resizeMode='contain' source={logo} />
    </View>
  )
}

export default App
