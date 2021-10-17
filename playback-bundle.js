(() => {
  // ieeevisdb.ts
  var IeeeVisDb = class {
    constructor() {
      this.initFirebase();
    }
    initFirebase() {
      firebase.initializeApp({
        apiKey: "AIzaSyCfFQ-eN52od55QBFZatFImgZgEDHK_P4E",
        authDomain: "ieeevis.firebaseapp.com",
        databaseURL: "https://ieeevis-default-rtdb.firebaseio.com",
        projectId: "ieeevis",
        storageBucket: "ieeevis.appspot.com",
        messagingSenderId: "542997735159",
        appId: "1:542997735159:web:6d9624111ec276a61fd5f2",
        measurementId: "G-SNC8VC6RFM"
      });
      firebase.analytics();
      this.logsRef = firebase.database().ref("logs/");
    }
    loadRoom(roomId, onRoomUpdated) {
      this.roomRef = firebase.database().ref("rooms/" + roomId);
      this.roomRef.on("value", (snapshot) => {
        onRoomUpdated(snapshot.val());
      });
    }
    loadSession(sessionId, onSessionUpdated) {
      this.sessionRef = firebase.database().ref("sessions/" + sessionId);
      this.sessionRef.on("value", (snapshot) => {
        onSessionUpdated(snapshot.val());
      });
    }
    loadAllSessions(callback) {
      const ref = firebase.database().ref("sessions/");
      ref.on("value", (snapshot) => callback(snapshot.val()));
    }
    loadAdmins(callback) {
      this.adminsRef = firebase.database().ref("admins");
      this.adminsRef.on("value", (snapshot) => {
        callback(snapshot.val());
      });
    }
    set(path, value) {
      this.sessionRef?.child(path).set(value);
    }
    setRoom(path, value) {
      this.roomRef?.child(path).set(value);
    }
    log(log) {
      const date = new Date(log.time);
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      const year = date.getUTCFullYear();
      const dayString = `${year}-${month}-${day}`;
      const hour = date.getUTCHours();
      const minute = date.getUTCMinutes();
      const second = date.getUTCSeconds();
      const milli = date.getUTCMilliseconds();
      const timeString = `${hour}:${minute}:${second}:${milli}`;
      this.logsRef?.child(dayString).child(log.room).child(timeString).set(log);
    }
    loadLogs(room, day, callback) {
      const logsRef = firebase.database().ref(`logs/${day}/${room}`);
      logsRef.on("value", (snapshot) => {
        callback(snapshot.val());
      });
    }
  };

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

  // replayvideoplayer.ts
  var IeeeVisReplayVideoPlayer = class {
    constructor(elementId, getCurrentVideoId) {
      this.elementId = elementId;
      this.getCurrentVideoId = getCurrentVideoId;
      this.audioContext = new AudioContext();
      this.width = 400;
      this.height = 300;
      this.youtubeApiReady = false;
      this.youtubePlayerLoaded = false;
      this.youtubePlayerReady = false;
      this.init();
    }
    onYouTubeIframeAPIReady() {
      this.youtubeApiReady = true;
    }
    updateVideo() {
      if (!this.youtubeApiReady) {
        return;
      }
      if (!this.youtubePlayerLoaded) {
        this.loadYoutubePlayer();
      } else {
        if (!this.getCurrentVideoId() && this.player) {
          this.player.stopVideo();
        } else {
          this.changeYoutubeVideo();
        }
      }
    }
    setSize(width, height) {
      this.width = width;
      this.height = height;
      if (!this.player) {
        return;
      }
      this.player.setSize(width, height);
    }
    init() {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    onPlayerReady() {
      console.log("player ready", this.player);
      this.youtubePlayerReady = true;
      if (this.audioContext.state === "suspended") {
        this.player.mute();
      }
      this.player.playVideo();
      this.updateVideo();
    }
    onPlayerStateChange(state) {
      if (state.data === PlayerState.UNSTARTED) {
        this.player.seekTo(this.getCurrentStartTimeS() || 0, true);
      }
      if (state.data === PlayerState.PLAYING || state.data === PlayerState.BUFFERING) {
        const startTime = this.getCurrentStartTimeS() || 0;
        const currentTime = this.player.getCurrentTime();
        if (Math.abs(startTime - currentTime) > 5) {
          this.player.seekTo(startTime, true);
          console.log("lagging behind. seek.", this.getCurrentStartTimeS(), this.player.getCurrentTime(), this.player.getDuration(), this.player);
        }
      }
    }
    loadYoutubePlayer() {
      this.youtubePlayerLoaded = true;
      this.player = new YT.Player(this.elementId, {
        width: this.width,
        height: this.height,
        videoId: this.getCurrentVideoId(),
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
    changeYoutubeVideo() {
      this.player.loadVideoById(this.getCurrentVideoId(), this.getCurrentStartTimeS());
      this.player.playVideo();
    }
    getCurrentStartTimeS() {
      return -1;
    }
  };

  // playback.ts
  var _IeeeVisStreamPlayback = class {
    constructor(ROOM_ID, DAY) {
      this.ROOM_ID = ROOM_ID;
      this.DAY = DAY;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.PANEL_WIDTH_PERCENT = 30;
      this.sessionsData = {};
      this.roomSlices = [];
      this.db = new IeeeVisDb();
      this.player = new IeeeVisReplayVideoPlayer(_IeeeVisStreamPlayback.PLAYER_ELEMENT_ID, this.getCurrentVideoId.bind(this));
      this.db.loadRoom(ROOM_ID, (room) => this.onRoomUpdated(room));
      this.loadPreviewImage();
      this.resize();
      window.addEventListener("resize", this.resize.bind(this));
      this.db.loadAllSessions((sessionsData) => {
        this.sessionsData = sessionsData;
        this.db.loadLogs(ROOM_ID, DAY, this.getLogs.bind(this));
      });
    }
    getLogs(logsData) {
      const slices = [];
      const logs = Object.values(logsData);
      for (let i = 1; i < logs.length; i++) {
        this.addSliceIfYouTube(slices, logs[i - 1], logs[i].time - logs[i - 1].time);
      }
      this.addSliceIfYouTube(slices, logs[logs.length - 1], -1);
      this.roomSlices = slices;
      this.updateTable();
    }
    updateTable() {
      if (!this.roomSlices.length) {
        return;
      }
      const tableBody = document.getElementById("videos-table-body");
      tableBody.innerHTML = "";
      for (const slice of this.roomSlices) {
        const stage = slice.stage;
        const active = false;
        const isPreview = stage.state === "PREVIEW";
        const ytUrl = `https://www.youtube.com/watch?v=${stage.youtubeId}`;
        const imgUrl = stage.imageUrl;
        let duration = "";
        const startText = !slice.log.time ? "" : new Date(slice.log.time).toISOString().substr(0, 16).replace("T", ", ");
        if (slice.duration != -1) {
          const durationMs = slice.duration;
          duration = new Date(durationMs).toISOString().substr(11, 8);
        } else {
          duration = "-";
        }
        const tr = document.createElement("tr");
        tr.className = active ? "active" : "";
        tr.innerHTML = `
                <td>${stage.title}</a></td>
                <td>${startText} UTC</td>
                <td>${duration}</td>
                <td>${Math.round(slice.startTimeMs / 1e3)}</td>
                <td>${Math.round(slice.endTimeMs / 1e3)}</td>`;
        tr.addEventListener("click", () => this.clickStage(slice));
        tableBody.append(tr);
      }
    }
    clickStage(slice) {
      console.log("hiii2", slice);
    }
    addSliceIfYouTube(slices, log, duration) {
      const slice = this.createSliceIfYouTube(log, duration);
      if (slice) {
        slices.push(slice);
      }
    }
    createSliceIfYouTube(log, duration) {
      const stage = this.getSessionStage(log);
      if (!stage.youtubeId) {
        return;
      }
      const startTimeMs = stage.youtubeId && stage.live ? log.status.videoStartTimestamp - log.status.liveStreamStartTimestamp : 0;
      const endTimeMs = startTimeMs + duration;
      return {
        duration,
        stage,
        log,
        startTimeMs,
        endTimeMs
      };
    }
    getSessionStage(log) {
      return this.sessionsData[log.session].stages[log.status.videoIndex];
    }
    onYouTubeIframeAPIReady() {
      this.player.onYouTubeIframeAPIReady();
    }
    loadPreviewImage() {
      console.log("loading preview", this.getCurrentStage()?.imageUrl);
      const url = this.getCurrentStage()?.imageUrl;
      const html = !url ? "" : `<img src="${url}"  alt="Preview Image" id="preview-img" />`;
      const previewWrap = document.getElementById("image-outer");
      previewWrap.innerHTML = html;
    }
    onRoomUpdated(room) {
      this.room = room;
    }
    onSessionUpdated(id, session) {
      const lastSession = this.currentSession ? {...this.currentSession} : void 0;
      const lastYtId = this.getCurrentVideoId();
      this.currentSession = session;
      document.getElementById("session-name").innerText = this.getCurrentStage()?.title || "";
      if (this.getCurrentVideoId() != lastYtId) {
        this.player.updateVideo();
      }
      if (this.getCurrentStage()?.imageUrl != this.getCurrentStageOfSession(lastSession)?.imageUrl) {
        this.loadPreviewImage();
      }
      this.resize();
    }
    getCurrentStage() {
      return this.getCurrentStageOfSession(this.currentSession);
    }
    getCurrentStageOfSession(session) {
      return session?.stages[session?.currentStatus?.videoIndex];
    }
    getCurrentVideoId() {
      return this.getCurrentStage()?.youtubeId;
    }
    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight - 15;
      const state = this.getCurrentStage()?.state;
      if (!state) {
        return;
      }
      if (state === "SOCIALIZING") {
        document.getElementById("youtube-outer").style.display = "none";
        document.getElementById("image-outer").style.display = "none";
        document.getElementById("gathertown-outer").style.display = "";
      } else if (state === "PREVIEW") {
        document.getElementById("youtube-outer").style.display = "none";
        document.getElementById("image-outer").style.display = "";
        document.getElementById("gathertown-outer").style.display = "none";
      } else {
        document.getElementById("youtube-outer").style.display = "";
        document.getElementById("image-outer").style.display = "none";
        document.getElementById("gathertown-outer").style.display = "none";
      }
      const contentWidth = this.width * (100 - this.PANEL_WIDTH_PERCENT) / 100;
      const mainContentHeight = this.height - _IeeeVisStreamPlayback.HEADERS_HEIGHT;
      const contentWrap = document.getElementById(_IeeeVisStreamPlayback.CONTENT_WRAPPER_ID);
      contentWrap.style.width = `${contentWidth}px`;
      this.player.setSize(contentWidth, mainContentHeight);
      const previewImg = document.getElementById("preview-img");
      if (previewImg) {
        document.getElementById("image-outer").style.height = `${mainContentHeight}px`;
        previewImg.style.maxWidth = `${contentWidth}px`;
        previewImg.style.maxHeight = `${mainContentHeight}px`;
      }
      const gatherFrame = document.getElementById("gathertown-iframe");
      if (gatherFrame) {
        gatherFrame.setAttribute("width", `${contentWidth}`);
        gatherFrame.setAttribute("height", `${mainContentHeight}`);
      }
    }
  };
  var IeeeVisStreamPlayback = _IeeeVisStreamPlayback;
  IeeeVisStreamPlayback.PLAYER_ELEMENT_ID = "ytplayer";
  IeeeVisStreamPlayback.CONTENT_WRAPPER_ID = "content";
  IeeeVisStreamPlayback.HEADERS_HEIGHT = 41;
  var search = location.search.indexOf("room=") === -1 ? "" : location.search.substr(location.search.indexOf("room=") + "room=".length);
  var dayIndex = search.indexOf("day=");
  if (search && dayIndex) {
    const roomId = search.substr(0, dayIndex - 1);
    const dayString = search.substr(dayIndex + "day=".length);
    playback = new IeeeVisStreamPlayback(roomId, dayString);
    document.getElementById("wrapper").style.display = "flex";
    onYouTubeIframeAPIReady = () => {
      playback.onYouTubeIframeAPIReady();
    };
  } else {
    document.getElementById("param-error").style.display = "block";
  }
})();
//# sourceMappingURL=playback-bundle.js.map