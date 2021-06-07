(() => {
  // youtubeplayer.ts
  var PlayerState;
  (function(PlayerState2) {
    PlayerState2[PlayerState2["UNSTARTED"] = -1] = "UNSTARTED";
    PlayerState2[PlayerState2["ENDED"] = 0] = "ENDED";
    PlayerState2[PlayerState2["PLAYING"] = 1] = "PLAYING";
    PlayerState2[PlayerState2["PAUSED"] = 2] = "PAUSED";
    PlayerState2[PlayerState2["BUFFERING"] = 3] = "BUFFERING";
    PlayerState2[PlayerState2["CUED"] = 5] = "CUED";
  })(PlayerState || (PlayerState = {}));

  // ieeevisdb.ts
  var IeeeVisDb = class {
    constructor(onData) {
      this.onData = onData;
      this.initFirebase();
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
    loadData() {
      this.trackRef = firebase.database().ref("tracks/track1");
      this.trackRef.on("value", (snapshot) => {
        this.onData(snapshot.val());
      });
    }
    set(path, value) {
      this.trackRef.child(path).set(value);
    }
  };

  // main.ts
  var _IeeeVisStream = class {
    constructor() {
      this.youtubeApiReady = false;
      this.youtubePlayerLoaded = false;
      this.youtubePlayerReady = false;
      this.db = new IeeeVisDb(this.onData.bind(this));
      this.initYoutube();
      this.db.loadData();
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
      this.youtubePlayerReady = true;
      const playerIframe = document.getElementById("ytplayer");
      playerIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
    }
    onPlayerStateChange(state) {
      if (state.data === PlayerState.UNSTARTED) {
        this.player.seekTo(this.getCurrentStartTimeS(), true);
      }
      if (state.data === PlayerState.PAUSED) {
        this.player.playVideo();
        this.player.seekTo(this.getCurrentStartTimeS(), true);
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
    onData(track) {
      const lastYtId = this.getCurrentYtId();
      this.data = track;
      document.getElementById("track-title").innerText = this.data.name;
      if (this.getCurrentYtId() != lastYtId) {
        this.updateVideo();
      }
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
      if (this.getCurrentVideo().type === "prerecorded" || !this.youtubePlayerReady) {
        const timeMs = new Date().getTime();
        const videoStartTimestampMs = this.data?.currentStatus?.videoStartTimestamp;
        console.log(Math.round((timeMs - videoStartTimestampMs) / 1e3), timeMs, videoStartTimestampMs);
        return Math.round((timeMs - videoStartTimestampMs) / 1e3);
      } else if (this.getCurrentVideo().type === "live") {
        return this.player.getDuration();
      }
    }
  };
  var IeeeVisStream = _IeeeVisStream;
  IeeeVisStream.PLAYER_ELEMENT_ID = "ytplayer";
  var stream = new IeeeVisStream();
  onYouTubeIframeAPIReady = () => {
    stream.onYouTubeIframeAPIReady();
  };
})();
