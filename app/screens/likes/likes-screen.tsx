import React, { FC, useEffect, useState } from "react"
import {
  Dimensions,
  View,
  Image,
  ImageBackground,
  FlatList,
  StyleSheet,
  Share
} from "react-native"
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { StackScreenProps } from "@react-navigation/stack"
import { observer } from "mobx-react-lite"
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Header,
  Screen,
  Text,
  Icon, Button,
} from "../../components"

import { convertDate, convertUrl } from "../../utils/converters"
import { color, spacing } from "../../theme"
import { NavigatorParamList } from "../../navigators"

const SCREEN_HEIGHT = Dimensions.get('window').height
const SCREEN_WIDTH = Dimensions.get('window').width

export const LikesScreen: FC<StackScreenProps<NavigatorParamList, "like">> = observer(
  ({ navigation }) => {
    const [carouselRef, setRef] = useState(undefined)
    const goBack = () => navigation.goBack()

    const [likes, setLikes] = useState([])
    const [activeIndex, setIndex] = useState(0)
    const [isListView, setIsListView] = useState(true)

    useEffect(() => {
      AsyncStorage.getItem('likes').then(likes => {
        if (!likes) {
          AsyncStorage.setItem('likes', '[]')
        } else {
          setLikes(JSON.parse(likes))
        }
      })
    }, [])

    const chooseItem = (index) => {
      setIndex(index)
      setIsListView(false)
    }

    const removeLike = () => {
      const newLikes = JSON.parse(JSON.stringify(likes))
      newLikes.splice(activeIndex, 1)
      AsyncStorage.setItem('likes', JSON.stringify(newLikes)).then(() => {
        if (activeIndex === likes.length - 1) {
          setIndex(activeIndex - 1)
        }
        setLikes(newLikes)
      })
    }

    const share = () => {
      const item = likes[activeIndex]
      Share.share({
        message:
          `${item.rover.name} ${item.camera.full_name} ${convertDate(item.earth_date)}`,
        url: convertUrl(item.img_src)
      }).then(result => {
        console.log(result.action)
      }).catch(error => {
        alert(error.message);
      })
    }

    const renderItem = ({ item }) => {
      return (
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
      );
    }

    const renderListItem = ({ item, index }) => {
      return (
        <Button preset="link" style={styles.listItem} onPress={() => chooseItem(index)}>
          <Image source={{ uri: convertUrl(item.img_src) }} style={styles.imageList} />
          <View>
            <Text style={[styles.text, styles.textListItem]}>
              {item.rover.name}
            </Text>
            <Text style={[styles.text, styles.textListItem]}>
              {item.camera.full_name}
            </Text>
            <Text style={[styles.text, styles.textListItem]}>
              {convertDate(item.earth_date)}
            </Text>
          </View>
        </Button>
      )
    }

    const leftIcon = <Icon style={styles.headerIcon} icon="back" />
    const rightIcon = <Icon style={styles.headerIcon} icon={isListView ? "carousel" : "list"} />

    return (
      <View testID="LikesScreen" style={styles.full}>
        <Screen style={styles.container}>
          <Header
            headerText="My likes"
            style={styles.header}
            titleStyle={[styles.text, styles.headerTitle]}
            leftButton={leftIcon}
            onLeftPress={goBack}
            rightButton={rightIcon}
            onRightPress={() => setIsListView(!isListView)}
          />
          <View style={[
            styles.center,
            isListView ? styles.containerList : styles.containerCarousel,
            styles.shadow
          ]}>
            {isListView ? (
              <FlatList
                data={likes}
                renderItem={renderListItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={<Text>No likes</Text>}
              />
            ) : (
              <Carousel
                layout={"default"}
                ref={(c) => setRef(c)}
                data={likes}
                firstItem={activeIndex}
                renderItem={renderItem}
                sliderWidth={SCREEN_WIDTH}
                itemWidth={SCREEN_WIDTH - 60}
                onSnapToItem={(index) => setIndex(index)}
              />
            )}
          </View>
          <View style={styles.footer}>
            {!isListView &&
            <View>
              <View style={[styles.buttonContainer, styles.shadow]}>
                <Button
                  style={[styles.button, styles.buttonRemove]}
                  preset="link"
                  disabled={likes.length === 0}
                  onPress={removeLike}
                >
                  <Image
                    style={styles.buttonImage}
                    source={require('./delete.png')}
                  />
                </Button>
                <Button
                  style={[styles.button, styles.buttonShare]}
                  preset="link"
                  disabled={likes.length === 0}
                  onPress={share}
                >
                  <Image
                    style={styles.buttonImage}
                    source={require('./share.png')}
                  />
                </Button>
              </View>
              {likes.length <= 10 && (
                <Pagination
                  dotsLength={likes.length}
                  activeDotIndex={activeIndex}
                  carouselRef={carouselRef}
                  tappableDots
                  dotStyle={styles.dot}
                  inactiveDotOpacity={0.4}
                  inactiveDotScale={0.6}
                />
              )}
            </View>
            }
            <Text style={styles.textHelp}>
              {`${likes.length} cards`}
            </Text>
          </View>
        </Screen>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  button: {
    borderRadius: 100,
    height: 60,
    width: 60
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buttonImage: {
    alignSelf: 'center',
    height: 35,
    width: 35
  },
  buttonRemove: {
    backgroundColor: color.palette.black
  },
  buttonShare: {
    backgroundColor: color.primary
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
  containerCarousel: {
    height: SCREEN_HEIGHT - 250,
  },
  containerList: {
    height: SCREEN_HEIGHT - 200,
  },
  dot: {
    backgroundColor: color.palette.black,
    borderRadius: 5,
    height: 10,
    marginHorizontal: 4,
    padding: 3,
    width: 10
  },
  footer: {
    marginBottom: 20,
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
    width: 25
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
  imageList: {
    borderRadius: 5,
    height: 60,
    marginRight: 20,
    width: 60,
  },
  listItem: {
    alignItems: 'center',
    borderColor: color.border,
    borderStyle: 'solid',
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 15,
    paddingVertical: 10,
    width: '100%',
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
  },
  textListItem: {
    fontSize: 14
  }
});
