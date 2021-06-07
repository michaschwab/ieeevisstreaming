(() => {
  // main.ts
  var _IeeeVisStream = class {
    constructor() {
      this.youtubeApiReady = false;
      this.youtubePlayerLoaded = false;
      this.startedPlaying = false;
      this.initFirebase();
      this.initYoutube();
      this.loadData();
    }
    initFirebase() {
      const firebaseConfig = {
        apiKey: "AIzaSyCfFQ-eN52od55QBFZatFImgZgEDHK_P4E",
        authDomain: "ieeevis.firebaseapp.com",
        databaseURL: "https://ieeevis-default-rtdb.firebaseio.com",
        projectId: "ieeevis",
        storageBucket: "ieeevis.appspot.com",
        messagingSenderId: "542997735159",
        appId: "1:542997735159:web:6d9624111ec276a61fd5f2",
        measurementId: "G-SNC8VC6RFM"
      };
      firebase.initializeApp(firebaseConfig);
      firebase.analytics();
    }
    initYoutube() {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    onYouTubeIframeAPIReady() {
      this.youtubeApiReady = true;
    }
    onPlayerReady() {
      console.log("player ready", this.player);
      const playerIframe = document.getElementById("ytplayer");
      playerIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
    }
    onPlayerStateChange() {
      if (!this.startedPlaying) {
        this.startedPlaying = true;
        this.player.pauseVideo();
        setTimeout(() => {
        }, 1e3);
      } else {
        this.player.playVideo();
      }
    }
    loadYoutubePlayer() {
      this.youtubePlayerLoaded = true;
      this.player = new YT.Player(_IeeeVisStream.PLAYER_ELEMENT_ID, {
        height: "600",
        width: "1000",
        videoId: this.getCurrentYtId() + "?autoplay=1",
        playerVars: {
          "playsinline": 1,
          "autoplay": 1,
          "controls": 1,
          "rel": 0,
          "modestbranding": 1,
          "mute": 0,
          start: this.getCurrentStartTimeS()
        },
        events: {
          "onReady": this.onPlayerReady.bind(this),
          "onStateChange": this.onPlayerStateChange.bind(this)
        }
      });
    }
    loadData() {
      var trackRef = firebase.database().ref("tracks/track1");
      trackRef.on("value", (snapshot) => {
        const lastYtId = this.getCurrentYtId();
        this.data = snapshot.val();
        if (this.getCurrentYtId() != lastYtId) {
          this.updateVideo();
        }
      });
    }
    updateVideo() {
      if (!this.data || !this.getCurrentYtId() || !this.youtubeApiReady) {
        return;
      }
      if (!this.youtubePlayerLoaded) {
        this.loadYoutubePlayer();
      } else {
        this.changeYoutubeVideo();
      }
    }
    changeYoutubeVideo() {
      console.log("change yt vid");
      this.player.loadVideoById(this.getCurrentYtId(), this.getCurrentStartTimeS());
      this.player.playVideo();
    }
    getCurrentVideo() {
      return this.data?.videos[this.data?.currentStatus?.videoIndex];
    }
    getCurrentYtId() {
      return this.getCurrentVideo()?.youtubeId;
    }
    getCurrentStartTimeS() {
      const timeMs = new Date().getTime();
      const videoStartTimestampMs = this.data?.currentStatus?.videoStartTimestamp;
      const videoStartTimeS = this.data?.currentStatus?.videoStartTime;
      console.log(Math.round((timeMs - videoStartTimestampMs) / 1e3) + videoStartTimeS, videoStartTimestampMs, videoStartTimeS);
      return Math.round((timeMs - videoStartTimestampMs) / 1e3) + videoStartTimeS;
    }
  };
  var IeeeVisStream = _IeeeVisStream;
  IeeeVisStream.PLAYER_ELEMENT_ID = "ytplayer";
  var stream = new IeeeVisStream();
  onYouTubeIframeAPIReady = () => {
    stream.onYouTubeIframeAPIReady();
  };
})();
