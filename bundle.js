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
      this.audioContext = new AudioContext();
      this.youtubeApiReady = false;
      this.youtubePlayerLoaded = false;
      this.youtubePlayerReady = false;
      this.width = window.innerWidth;
      this.height = window.innerHeight - 120;
      this.CHAT_WIDTH_PERCENT = 40;
      this.CHAT_PADDING_LEFT_PX = 20;
      this.GATHERTOWN_HEIGHT_PERCENT = 40;
      this.currentPanelTab = "discord";
      this.lastForcedSeek = 0;
      this.db = new IeeeVisDb(this.onData.bind(this));
      this.initYoutube();
      this.db.loadData();
      this.loadDiscord();
      this.loadSlido();
      this.loadGathertown();
      this.initPanelTabs();
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
      if (this.audioContext.state === "suspended") {
        this.player.mute();
      }
      this.player.playVideo();
    }
    onPlayerStateChange(state) {
      if (state.data === PlayerState.UNSTARTED) {
        this.player.seekTo(this.getCurrentStartTimeS(), true);
      }
      if (state.data === PlayerState.PLAYING || state.data === PlayerState.BUFFERING) {
        const startTime = this.getCurrentStartTimeS();
        const currentTime = this.player.getCurrentTime();
        if (Math.abs(startTime - currentTime) > 5 && Date.now() - this.lastForcedSeek > 1e4) {
          this.player.seekTo(this.getCurrentStartTimeS(), true);
          console.log("lagging behind. seek.", this.getCurrentStartTimeS(), this.player.getCurrentTime());
          this.lastForcedSeek = Date.now();
        }
      }
    }
    loadYoutubePlayer() {
      this.youtubePlayerLoaded = true;
      this.player = new YT.Player(_IeeeVisStream.PLAYER_ELEMENT_ID, {
        width: this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100,
        height: (this.height - _IeeeVisStream.HEADERS_HEIGHT * 2) * (100 - this.GATHERTOWN_HEIGHT_PERCENT) / 100,
        videoId: this.getCurrentYtId(),
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
    loadDiscord() {
      const html = `<iframe src="https://titanembeds.com/embed/851543399982170163?defaultchannel=851543400461107241"
                              width="${this.width * this.CHAT_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX}"
                              height="${this.height - _IeeeVisStream.HEADERS_HEIGHT}"
                              frameborder="0"></iframe>`;
      document.getElementById("discord-wrap").innerHTML += html;
    }
    loadSlido() {
      const frame = document.getElementById("slido-frame");
      frame.setAttribute("width", `${this.width * this.CHAT_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX}`);
      frame.setAttribute("height", `${this.height - _IeeeVisStream.HEADERS_HEIGHT}`);
    }
    loadGathertown() {
      const html = `<iframe title="gather town"
                              width="${this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100}"
                              height="${(this.height - _IeeeVisStream.HEADERS_HEIGHT * 2) * this.GATHERTOWN_HEIGHT_PERCENT / 100}"
                              allow="camera;microphone"
                              src="https://gather.town/app/NCPq3ewRqxrhEGTe/vis21-demo-test"></iframe>`;
      const contentWrap = document.getElementById(_IeeeVisStream.CONTENT_WRAPPER_ID);
      contentWrap.style.width = `${this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100}px`;
      const gatherWrap = document.getElementById(_IeeeVisStream.GATHERTOWN_WRAPPER_ID);
      gatherWrap.innerHTML = html;
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
      this.lastForcedSeek = 0;
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
        return Math.round((timeMs - videoStartTimestampMs) / 1e3);
      } else if (this.getCurrentVideo().type === "live") {
        return this.player.getDuration();
      }
    }
    initPanelTabs() {
      const getToggle = (tabName) => () => {
        console.log(tabName);
        this.currentPanelTab = tabName;
        document.getElementById("discord-tab-link").className = "";
        document.getElementById("slido-tab-link").className = "";
        document.getElementById(`${tabName}-tab-link`).className = "active";
        document.getElementById("discord-wrap").className = "";
        document.getElementById("slido-wrap").className = "";
        document.getElementById(`${tabName}-wrap`).className = "active";
      };
      document.getElementById("discord-tab-link").onclick = getToggle("discord");
      document.getElementById("slido-tab-link").onclick = getToggle("slido");
    }
  };
  var IeeeVisStream = _IeeeVisStream;
  IeeeVisStream.PLAYER_ELEMENT_ID = "ytplayer";
  IeeeVisStream.CONTENT_WRAPPER_ID = "content";
  IeeeVisStream.GATHERTOWN_WRAPPER_ID = "gathertown";
  IeeeVisStream.PANEL_HEADER_ID = "panel-header";
  IeeeVisStream.HEADERS_HEIGHT = 30;
  var stream = new IeeeVisStream();
  onYouTubeIframeAPIReady = () => {
    stream.onYouTubeIframeAPIReady();
  };
})();
//# sourceMappingURL=bundle.js.map
