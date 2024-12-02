import React, {useCallback, useMemo, useState} from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
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
});

function App() {
  const [url, setUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState('');

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
        <!-- 뷰포트를 디바이스 크기에 맞게 변경하도록 해줌 -->
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

            // 4. The API will call this function when the video player is ready.
            function onPlayerReady(event) {
              event.target.playVideo();
            }

            // 5. The API calls this function when the player's state changes.
            //    The function indicates that when playing a video (state=1),
            //    the player should play for six seconds and then stop.
            var done = false;
            function onPlayerStateChange(event) {
              if (event.data == YT.PlayerState.PLAYING && !done) {
                setTimeout(stopVideo, 6000);
                done = true;
              }
            }
            function stopVideo() {
              player.stopVideo();
            }
          </script>
        </body>
      </html>`;
    return {
      html,
    };
  }, [youtubeId]);
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
            source={source}
            scrollEnabled={false}
            // ios에서 다른 창이 띄워지는걸 막고 인라인 재생되도록 해줌
            allowsInlineMediaPlayback
            // android에서 현재 유투브의 자동 재생 기능을 허용함
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

export default App;
