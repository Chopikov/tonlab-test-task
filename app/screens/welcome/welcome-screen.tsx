import React, { FC, useEffect, useState, useMemo } from "react"
import {
  Animated,
  Dimensions,
  View,
  ViewStyle,
  TextStyle,
  ImageBackground,
  ImageStyle,
  Image,
  PanResponder,
  StyleSheet
} from "react-native"
import * as Progress from 'react-native-progress'
import { StackScreenProps } from "@react-navigation/stack"
import { useIsFocused } from "@react-navigation/native";
import { observer } from "mobx-react-lite"
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Button,
  Header,
  Screen,
  Text,
  Icon
} from "../../components"

import { convertDate, convertUrl } from "../../utils/converters"
import { color, spacing } from "../../theme"
import { NavigatorParamList } from "../../navigators"

const SCREEN_HEIGHT = Dimensions.get('window').height
const SCREEN_WIDTH = Dimensions.get('window').width

const IMAGE_ANIMATED = (indexOffset, offset): ViewStyle => {
  return {
    height: SCREEN_HEIGHT - 250,
    width: SCREEN_WIDTH,
    paddingHorizontal: 30,
    alignSelf: 'center',
    position:'absolute',
    top: - indexOffset * 40 + (Math.abs(offset) / SCREEN_WIDTH) * 40,
  }
}

const HEADER_TEXT = (disabled): TextStyle => {
  return {
    fontSize: 18,
    color: disabled ? color.primary : '#CFD8DC'
  }
}

const BUTTON_IMAGE = (offset): ImageStyle => {
  return {
    width: 60 - offset / 15,
    height: 60 - offset / 15,
    opacity: 1 / Math.max(offset / 4, 1)
  }
}

export const WelcomeScreen: FC<StackScreenProps<NavigatorParamList, "welcome">> = observer(
  ({ navigation }) => {
    const isFocused = useIsFocused();
    const [index, setIndex] = useState(0)
    const [offset, setOffset] = useState(1)
    const [likes, setLikes] = useState([])

    const [state, setState] = useState({
      isLoading: false,
      error: undefined,
      photos: [],
    })

    const getPhotos = () => {
      setState(s => ({ ...s, isLoading: true }))
      const sol = Math.floor(Math.random() * 1000)
      const API_KEY = 'sJ1m7dvDLEoHvN0qBvjk2GeKuHQ4imPVWtPctv6h'
      fetch(
        `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=${sol}&camera=fhaz&page=0&api_key=${API_KEY}`,
      )
        .then(response => response.json())
        .then(json => {
          setState({
            isLoading: false,
            error: json.error ? json.error.message : undefined,
            photos: json.photos || [],
          })
        })
        .catch(e => {
          setState(s => ({ ...s, isLoading: false, error: e }))
        })
      setIndex(0)
    }

    useEffect(() => {
      AsyncStorage.getItem('likes').then(likesString => {
        if (!likesString) {
          AsyncStorage.setItem('likes', '[]')
        } else {
          setLikes(JSON.parse(likesString))
        }
      })
    }, [isFocused])

    useEffect(() => {
      getPhotos()
    }, [])

    const like = () => {
      const photo = state.photos[index]
      setIndex(ind => ind + 1)
      if (!likes.some(l => l.id === photo.id)) {
        const newLikes = likes.concat([photo])
        AsyncStorage.setItem('likes', JSON.stringify(newLikes)).then(() => {
          setLikes(newLikes)
        })
      }
    }
    const dislike = () => {
      setIndex(ind => ind + 1)
    }
    const undo = () => {
      if (index > 0) {
        const newLikes = likes.filter(l => l.id !== state.photos[index - 1].id)
        if (JSON.stringify(newLikes) !== JSON.stringify(likes)) {
          AsyncStorage.setItem('likes', JSON.stringify(newLikes)).then(() => {
            setLikes(newLikes)
          })
        }
        setIndex(ind => ind - 1)
      }
    }
    const openLikes = () => navigation.push('like')

    const swipeLeft = (dy=0) => {
      Animated.spring(position, {
        toValue: { x: -SCREEN_WIDTH - 50, y: dy },
        bounciness: 0,
        speed: 12,
        useNativeDriver: true
      }).start(() => {
        dislike()
        position.setValue({ x: 0, y: 0 })
      })
    }
    const swipeRight = (dy=0) => {
      Animated.spring(position, {
        toValue: { x: SCREEN_WIDTH + 50, y: dy },
        bounciness: 0,
        speed: 12,
        useNativeDriver: true
      }).start(() => {
        like()
        position.setValue({ x: 0, y: 0 })
      })
    }

    const position = useMemo(() => new Animated.ValueXY(), [])
    position.addListener((value) => setOffset(value.x))
    const panResponder = useMemo(() => PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onPanResponderMove: (evt, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          swipeRight(gestureState.dy)
        } else if (gestureState.dx < -120) {
          swipeLeft(gestureState.dy)
        } else {
          Animated.spring(position,
            { toValue: { x: 0, y: 0 }, friction: 8, useNativeDriver: true }
          ).start()
        }
      }
    }), [])

    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
      extrapolate: 'clamp'
    })
    const rotateAndTranslate: unknown = {
      transform: [{ rotate: rotate }, ...position.getTranslateTransform()]
    }

    const nextCardScale = (cardNumber) => position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: [1 - 0.1 * (cardNumber - 1), 1 - 0.1 * cardNumber, 1 - 0.1 * (cardNumber - 1)],
      extrapolate: 'clamp'
    })


    const UndoButton: JSX.Element = (
      <Text style={HEADER_TEXT(index > 0)}>
        Undo
      </Text>
    )
    const LikeButton: JSX.Element = <Icon icon={"heart"} style={styles.headerIcon} />

    const ImageElem = (ind): JSX.Element => (
      <ImageBackground
        source={{ uri: convertUrl(state.photos[ind].img_src) }}
        resizeMode="cover"
        style={[styles.imageBackground, styles.shadow]}
        imageStyle={styles.image}
      >
        <Text style={[styles.text, styles.textImage, styles.textImageTitle]}>
          {state.photos[ind].rover.name}
        </Text>
        <Text style={[styles.text, styles.textImage]}>
          {state.photos[ind].camera.full_name}
        </Text>
        <Text style={[styles.text, styles.textImage]}>
          {convertDate(state.photos[ind].earth_date)}
        </Text>
      </ImageBackground>
    )

    return (
      <View testID="WelcomeScreen" style={styles.full}>
        <Screen style={styles.container}>
          <Header
            headerText="My Mars"
            style={styles.header}
            titleStyle={[styles.text, styles.headerTitle]}
            leftButton={UndoButton}
            onLeftPress={undo}
            rightButton={LikeButton}
            onRightPress={openLikes}
          />
          {state.isLoading && (
            <Progress.Circle
              size={50}
              color={color.primary}
              indeterminate={true}
              style={styles.center}
            />
          )}
          {state.error && (
            <Text style={styles.text}>
              {state.error}
            </Text>
          )}
          {!state.isLoading && !state.error && index === state.photos.length &&
            <View style={styles.center}>
              <Text style={styles.buttonLoad} onPress={getPhotos}>Load new</Text>
            </View>
          }
          {state.photos.length > 0 && index !== state.photos.length &&
            <View style={styles.full}>
              {state.photos.map((item, i) => {
                if (i < index || i - index > 2) {
                  return null
                }
                if (i === index) {
                  return (
                    <Animated.View
                      {...panResponder.panHandlers}
                      style={[IMAGE_ANIMATED(i - index, offset), rotateAndTranslate]}
                      key={item.id}
                    >
                      {ImageElem(i)}
                    </Animated.View>
                  )
                }
                return (
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                      IMAGE_ANIMATED(i - index, offset),
                      { transform: [{ scale: nextCardScale(i - index) }] }
                    ]}
                    key={item.id}
                  >
                    {ImageElem(i)}
                  </Animated.View>
                )
              }).reverse()}
              <View style={styles.bottomContainer}>
                <View style={[styles.buttonContainer, styles.shadow]}>
                  <Button preset="link" onPress={() => swipeLeft(0)}>
                    <Image
                      style={BUTTON_IMAGE(offset)}
                      source={require('./button-dislike.png')}
                    />
                  </Button>
                  <Button preset="link" onPress={() => swipeRight(0)}>
                    <Image
                      style={BUTTON_IMAGE(-offset)}
                      source={require('./button-like.png')}
                    />
                  </Button>
                </View>
              </View>
            </View>
          }
          <View style={styles.footer}>
            <Text style={styles.textHelp}>
              {state.isLoading ? 'Downloading' : `${state.photos.length - index} cards`}
            </Text>
          </View>
        </Screen>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  bottomContainer: {
    marginBottom: -8,
    marginTop: 'auto',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buttonLoad: {
    color: color.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  center: {
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  container: {
    backgroundColor: color.palette.white,
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  footer: {
    marginBottom: 80,
    marginTop: 'auto'
  },
  full: {
    flex: 1
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingTop: spacing[3]
  },
  headerIcon: {
    height: 30,
    width: 30,
  },
  headerTitle: {
    fontSize: 20,
    letterSpacing: 1.3,
    textAlign: "center",
  },
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
  textHelp: {
    color: color.help,
    fontSize: 16,
    textAlign: "center",
  },
  textImage: {
    color: color.palette.white
  },
  textImageTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  }
});
