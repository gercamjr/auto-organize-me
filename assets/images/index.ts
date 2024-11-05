// export image files from this directory

import { ImageSourcePropType } from 'react-native'

const images = {
  logo: require('./red-car-logo.png'),
}

export default images as { [key: string]: ImageSourcePropType }
