vimeo-js-api
============

A wrapper for [Vimeo Javascript  API](https://developer.vimeo.com/player/js-api)  
Based on [Vimeo's Froogaloop API](https://github.com/vimeo/player-api/blob/master/javascript/)  

## Example

Embed the video to your page:
```html
<iframe id="myplayer" src="//player.vimeo.com/video/VIDEO_ID?player_id=myplayer&api=1" width="100%" height="100%" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
```
For more info about embeding, [see vimeo's embeding page](https://developer.vimeo.com/player/embedding)

```js
var api=$f('myplayer'); //or new Vimeo('myplayer') 
```



## Usage

instantiate via element
```js
var element=document.getElementById('myVimeoIframe');
var api=$f(element);
//or (alias of)
var api=new Vimeo(element);
```

or via iframe id
```js
var api=$f('myVimeoIframe');
//or (alias of)
var api=new Vimeo('myVimeoIframe');
```

## Methods

Example of use: 
```js
var myVideo=$f('myVimeoIframeID');
myVideo.play();
//or (alias of)
myVideo.api('play');
```

Using arguments:
```js
var myVideo=$f(document.getElementById('playerID'));
//from the start, 0 seconds
myVideo.seekTo(0);
//or (alias of)
myVideo.api('seekTo',0);
```

+ `play` play the video

```js
api.play();//Rock'n roll
```

+ `pause` pause the video

```js
api.pause();//Tired of the video? Pause it
```

+ `unload` stop the video

```js
api.unload();//ok, video has stopped, go do something else
```

+ `stop` alias of unload

```js
api.stop();//put it to end
```

+ `seekTo` _Float_ set video current time  (in seconds) 

```js
api.seekTo(12);//Bored? put the video in a cooler part
```

+ `setVolume` _Float_ set video volume from (muted) 0 to 1 (max)

```js
api.setVolume(0.9);//as loud as you want
```

+ `setLoop` _Boolean_ set video to loop or not

```js
api.setLoop(true);//video will now play forever
```

+ `setColor` _String_ set player color

```js
api.setColor('000000');//and I want to paint it black
```

+ `paused` _Boolean_ get wheter the video is paused or not

```js 
api.paused(function(isPaused, playerID){
 console.log(playerID+' is '+(isPaused ? 'paused' : 'playing'));
});
```

+ `getCurrentTime` _Integer_ get video current time in seconds

```js
api.getCurrentTime(function(currentTime, playerID){
 console.log(playerID+' is at '+currentTime+' seconds');
});
```

+ `getDuration` _Integer_ get video duration in seconds

```js
api.getDuration(function(duration, playerID){
 console.log(playerID+' has the duration of '+duration+' seconds');
});
```

+ `getVideoWidth` _Integer_ get video current width

```js
api.getVideoWidth(function(width, playerID){
 console.log(playerID+' has width '+width);
});
```

+ `getVideoHeight` _Integer_ get video current height

```js
api.getVideoHeight(function(height, playerID){
 console.log(playerID+' has height '+height);
});
```

+ `getVideoUrl` _String_ get video current url

```js
api.getVideoUrl(function(videoUrl, playerID){
 console.log(playerID+' has the video '+videoUrl);
});
```

+ `getVideoEmbedCode` _String_ get video embed code

```js
api.getVideoEmbedCode(function(videoEmbedCode, playerID){
 window.prompt('To share the video, paste this code in your website:',videoEmbedCode);
});
```

+ `getVolume` _Float_ get video current height

```js
api.getVolume(function(volume, playerID){
 console.log(playerID+' current volume is '+volume);
});
```

+ `getLoop`

```js
api.getLoop(function(isLoop, playerID){
 console.log('Is '+playerID+' in loop?',isLoop ? 'yes' : 'no');
});
```
+ `getColor`

```js
api.getColor(function(color, playerID){
 console.log(playerID+' current color is '+color);
});
```

All methods return the api instance, so you could use like:  
```js
api.pause().seekTo(10).play();
```

## Events

Example of use: 
```js
var myVideo=$f('myVimeoIframeID');
myVideo.onPlay();
//or (alias of)
myVideo.addEvent('play',function(event){
  console.log('Ok, we are live!');
});
```

+ `ready` Trigger once the video is ready to play

```js
api.onPause(function(event) {
  console.log('Video is now ready to play ... rock\'n roll!',event);
});
//or (alias of)
api.addEvent('ready',weAreReadyCallback);
api.removeEvent('ready');
```

+ 'play' Trigger whenever the user or you via api play the video

```js
api.onPlay(function(event) {
  console.log('Video is now playing  ... enjoy!',event);
});
//or (alias of)
api.addEvent('play',doSomethingWhenPlay);
api.removeEvent('pause');
```

+ 'pause' Trigger whenever the user or you via api pause the video

```js
api.onPause(function(event) {
  console.log('Video is pause ... take a break!',event);
});
//or (alias of)
api.addEvent('pause',doSomethingWhenPauseFunction);
api.removeEvent('pause');
```

+ 'finish' Trigger when video ends

```js
api.onFinish(function(event) {
  console.log('Video ended ... what should we do now?',event);
});
//or (alias of)
api.addEvent('finish',onFinishCallback);
api.removeEvent('finish');
```

+ 'seek' _Object_ {seconds: _Float_, duration: _Float_, percent: _Float_} Trigger when seek has changed.

```js
api.onSeek(function(event) {
  console.log(
    'video changed position to play at '+event.seconds+' seconds of '+event.duration+' total', 
    'it is now at '+(event.percent*100)+'%'
  );
});
//or (alias of)
api.addEvent('playProgress',onPlayProgressCallback)
api.removeEvent('playProgress');
```

+ 'playProgress' _Object_ {seconds: _Float_, duration: _Float_, percent: _Float_} Trigger while playing, a few times per second.

```js
api.onPlayProgress(function(event) {
  console.log(
    'video is playing at '+event.seconds+' seconds of '+event.duration+' total', 
    (event.percent*100)+'% already played'
  );
});
//or (alias of)
api.addEvent('playProgress',onPlayProgressCallback)
api.removeEvent('playProgress');
```

+ 'loadProgress' _Object_ {bytesTotal: _Float_, bytesTotal: _Float_, duration: _Float_, percent: _Float_} Trigger while loading, a few times per second.

```js
api.onLoadProgress(function(event) {
  console.log(
    'video loaded '+event.percent+'%', 
    event.bytesLoaded+' bytes loaded of '+event.bytesTotal+' total', //or -1 if not avaliable
    'Video duration is  '+event.duration+' seconds'
  );
});
//or (alias of)
api.addEvent('loadProgress',onLoadProgressCallback);
api.removeEvent('loadProgress');
```

## LICENCE

MIT

To be clear, I'm not affiliated with Vimeo in any way
