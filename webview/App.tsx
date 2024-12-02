import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import queryString from 'query-string';
import WebView from 'react-native-webview';

const YT_WIDTH = Dimensions.get('window').width;
const YT_HEIGHT = (YT_WIDTH * 9) / 16;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#242424',
  },
  inputContainer: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#AEAEB2',
    fontSize: 15,
    fontWeight: '500',
    marginRight: 4,
  },
  youtubeContainer: {
    width: YT_WIDTH,
    height: YT_HEIGHT,
    backgroundColor: '#4a4a4a',
  },
  controller: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 10,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    height: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    color: '#aeaeb2',
    alignSelf: 'flex-end',
    marginTop: 15,
    marginRight: 20,
    fontSize: 15,
  },
});

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = Math.floor(seconds % 60);
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = secondsLeft.toString().padStart(2, '0');
  return `${formattedMinutes}:${formattedSeconds}`;
};

function App() {
  const [url, setUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const webViewRef = useRef<WebView>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const onPressAddLink = useCallback(() => {
    const {
      query: {v: id},
    } = queryString.parseUrl(url);
    console.log('id', id);
    if (typeof id === 'string') {
      setYoutubeId(id);
    } else {
      Alert.alert('올바른 링크를 입력해주세요.');
    }
  }, [url]);

  const source = useMemo(() => {
    const html = `
    <!DOCTYPE html>
      <html>
        <!-- 뷰포트를 디바이스 크기에 맞게 변경 -->
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0;">
          <!-- 1. The <iframe> (and video player) will replace this <div> tag. -->
          <div id="player"></div>

          <script>
            // 2. This code loads the IFrame Player API code asynchronously.
            var tag = document.createElement('script');

            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // 3. This function creates an <iframe> (and YouTube player)
            //    after the API code downloads.
            var player;
            function onYouTubeIframeAPIReady() {
              player = new YT.Player('player', {
                height: '${YT_HEIGHT}',
                width: '${YT_WIDTH}',
                videoId: '${youtubeId}',
                events: {
                  'onReady': onPlayerReady,
                  'onStateChange': onPlayerStateChange
                }
              });
            }
            // 여러 데이터를 보낼때 사용될 프로토콜 함수를 만들어서 사용
            function postMessageToRN(type, data) {
              const message = JSON.stringify({type, data});
              window.ReactNativeWebView.postMessage(message);
            }
            
            function onPlayerReady(event) {
              postMessageToRN('duration', player.getDuration());
            }

            function onPlayerStateChange(event) {
              postMessageToRN('playerState', event.data);
            }
          </script>
        </body>
      </html>`;
    return {
      html,
    };
  }, [youtubeId]);

  const onPressPlay = useCallback(() => {
    if (webViewRef.current !== null) {
      webViewRef.current.injectJavaScript('player.playVideo(); true;');
    }
  }, []);

  const onPressPause = useCallback(() => {
    if (webViewRef.current !== null) {
      webViewRef.current.injectJavaScript('player.pauseVideo(); true;');
    }
  }, []);

  const durationText = useMemo(() => {
    return `${formatTime(Math.floor(duration))}`;
  }, [duration]);

  const currentTimeText = useMemo(() => {
    return `${formatTime(Math.floor(currentTime))}`;
  }, [currentTime]);

  useEffect(() => {
    if (isPlaying) {
      const id = setInterval(() => {
        if (webViewRef.current !== null) {
          webViewRef.current.injectJavaScript(
            'postMessageToRN("currentTime", player.getCurrentTime()); true;',
          );
        }
      }, 50);
      return () => clearInterval(id);
    }
  }, [isPlaying]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="클릭하여 링크를 삽입합니다."
          placeholderTextColor="#AEAEB2"
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          inputMode="url"
        />
        <TouchableOpacity hitSlop={10}>
          <Icon
            name="add-link"
            size={24}
            color="#AEAEB2"
            onPress={onPressAddLink}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.youtubeContainer}>
        {youtubeId.length > 0 && (
          <WebView
            ref={webViewRef}
            source={source}
            scrollEnabled={false}
            // ios에서 다른 창이 띄워지는걸 막고 인라인 재생되도록 해줌
            allowsInlineMediaPlayback
            // android에서 현재 유투브의 자동 재생 기능을 허용함
            mediaPlaybackRequiresUserAction={false}
            onMessage={event => {
              const {type, data} = JSON.parse(event.nativeEvent.data);
              if (type === 'playerState') {
                setIsPlaying(data === 1);
              } else if (type === 'duration') {
                setDuration(data);
              } else if (type === 'currentTime') {
                setCurrentTime(data);
              }
            }}
          />
        )}
      </View>
      <Text
        style={styles.timeText}>{`${currentTimeText} / ${durationText}`}</Text>
      <View style={styles.controller}>
        {isPlaying ? (
          <TouchableOpacity style={styles.playButton} onPress={onPressPause}>
            <Icon name="pause-circle" size={41.67} color="#e5e5ea" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.playButton} onPress={onPressPlay}>
            <Icon name="play-circle" size={39.58} color="#00dda8" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

export default App;
