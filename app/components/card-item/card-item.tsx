import React from "react"
import { ImageBackground, StyleSheet } from "react-native"
import PropTypes from 'prop-types';
import { Text } from ".."
import { convertDate, convertUrl } from "../../utils/converters"
import { color } from "../../theme"

export const CardItem = (item): JSX.Element => (
  <ImageBackground
    source={{ uri: convertUrl(item.img_src) }}
    resizeMode="cover"
    style={[styles.imageBackground, styles.shadow]}
    imageStyle={styles.image}
  >
    <Text style={[styles.text, styles.textImage, styles.textImageTitle]}>
      {item.rover.name}
    </Text>
    <Text style={[styles.text, styles.textImage]}>
      {item.camera.full_name}
    </Text>
    <Text style={[styles.text, styles.textImage]}>
      {convertDate(item.earth_date)}
    </Text>
  </ImageBackground>
)
CardItem.propTypes = {
  item: PropTypes.object.isRequired,
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 10
  },
  imageBackground: {
    flex: 1,
    padding: 20,
  },
  shadow: {
    shadowColor: color.palette.black,
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  text: {
    color: color.text,
    fontSize: 14,
    fontWeight: "100"
  },
  textImage: {
    color: color.palette.white
  },
  textImageTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  }
});
