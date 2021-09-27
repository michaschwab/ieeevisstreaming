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
    }
    loadRoom(roomId, onRoomUpdated) {
      this.roomRef = firebase.database().ref("rooms/" + roomId);
      this.roomRef.on("value", (snapshot) => {
        onRoomUpdated(snapshot.val());
      });
    }
    loadSession(sessionId2, onSessionUpdated) {
      this.sessionRef = firebase.database().ref("sessions/" + sessionId2);
      this.sessionRef.on("value", (snapshot) => {
        onSessionUpdated(snapshot.val());
      });
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
  };

  // auth.ts
  var IeeeVisAuth = class {
    constructor(onUser) {
      this.onUser = onUser;
      this.initFirebaseUi();
      this.initUi();
      this.trackAuthState();
    }
    initFirebaseUi() {
      var uiConfig = {
        signInSuccessUrl: location,
        signInOptions: [
          firebase.auth.GoogleAuthProvider.PROVIDER_ID
        ],
        tosUrl: "",
        privacyPolicyUrl: ""
      };
      const ui = new firebaseui.auth.AuthUI(firebase.auth());
      ui.start("#firebaseui-auth-container", uiConfig);
    }
    initUi() {
      document.getElementById("welcome").style.display = "none";
      document.getElementById("sign-out").addEventListener("click", function() {
        firebase.auth().signOut();
      });
    }
    trackAuthState() {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          document.getElementById("welcome").style.display = "";
          document.getElementById("displayName").innerText = user.displayName;
          document.getElementById("firebaseui-auth-container").style.display = "none";
        } else {
          document.getElementById("firebaseui-auth-container").style.display = "";
          document.getElementById("welcome").style.display = "none";
          document.getElementById("displayName").innerText = "";
        }
        this.onUser(user);
      });
    }
  };

  // main-admin.ts
  var IeeeVisStreamAdmin = class {
    constructor(SESSION_ID) {
      this.SESSION_ID = SESSION_ID;
      this.db = new IeeeVisDb();
      this.db.loadSession(SESSION_ID, (session) => this.onSessionUpdated(session));
      new IeeeVisAuth(this.onUserUpdated.bind(this));
      document.getElementById("previous-video-button").onclick = this.previousVideo.bind(this);
      document.getElementById("next-video-button").onclick = this.nextVideo.bind(this);
      document.getElementById("session-to-room-button").onclick = this.sessionToRoom.bind(this);
      setInterval(this.updateTable.bind(this), 1e3);
      this.db.loadAdmins((admins) => {
        this.admins = admins;
        this.onUserUpdated(this.user);
      });
    }
    onSessionUpdated(session) {
      this.session = session;
      document.getElementById("track-title").innerText = this.session.name;
      document.getElementById("room-id").innerText = this.session.room;
      this.db.loadRoom(session.room, (room) => this.onRoomUpdated(session.room, room));
    }
    onRoomUpdated(roomId, room) {
      if (roomId != this.session?.room) {
        return;
      }
      document.getElementById("room-name").innerText = room.name;
      document.getElementById("room-currentsession").innerText = room.currentSession;
      const isLive = room.currentSession == this.SESSION_ID;
      document.getElementById("live-session-alert").style.display = isLive ? "block" : "none";
      document.getElementById("live-room-name").innerText = room.name;
      document.getElementById("session-to-room-button").style.display = isLive ? "none" : "";
    }
    onUserUpdated(user) {
      this.user = user;
      document.getElementById("uid").innerText = this.user?.uid || "-";
      if (this.user && this.admins && this.admins.hasOwnProperty(this.user.uid)) {
        document.getElementById("access-alert").style.display = "none";
      } else {
        document.getElementById("access-alert").style.display = "";
      }
      this.updateTable();
    }
    updateTable() {
      if (!this.session || !this.user || !this.admins || !this.admins.hasOwnProperty(this.user.uid)) {
        return;
      }
      const tableBody = document.getElementById("videos-table-body");
      tableBody.innerHTML = "";
      const currentVideoPlayedMs = new Date().getTime() - this.session.currentStatus.videoStartTimestamp;
      for (const stageKey in this.session.stages) {
        const stage = this.session.stages[stageKey];
        const active = this.session.currentStatus.videoIndex.toString() === stageKey;
        const isPreview = stage.state === "PREVIEW";
        const timePlayed = !active ? "-" : new Date(currentVideoPlayedMs).toISOString().substr(11, 8);
        const ytUrl = `https://www.youtube.com/watch?v=${stage.youtubeId}`;
        const imgUrl = stage.imageUrl;
        let duration = "";
        const startText = !stage.time_start ? "" : new Date(stage.time_start).toISOString().substr(0, 16).replace("T", ", ");
        if (stage.time_start && stage.time_end) {
          const start = new Date(stage.time_start);
          const end = new Date(stage.time_end);
          const durationMs = end.getTime() - start.getTime();
          duration = new Date(durationMs).toISOString().substr(11, 8);
        } else if (stage.live) {
          duration = "(live)";
        } else {
          duration = "-";
        }
        const tr = document.createElement("tr");
        tr.className = active ? "active" : "";
        tr.innerHTML = `
                <td>` + (isPreview ? `<a href="${imgUrl}" target="_blank">[Image] ${stage.title}</a>` : `<a href=${ytUrl}" target="_blank">${stage.title}</a>`) + `
                </td>
                <td>${startText}</td>
                <td>${duration}</td>
                <td>${timePlayed}</td>
                <td>${stage.state}</td>`;
        tableBody.append(tr);
      }
    }
    previousVideo() {
      this.updateVideoIndex(this.session.currentStatus.videoIndex - 1);
    }
    nextVideo() {
      this.updateVideoIndex(this.session.currentStatus.videoIndex + 1);
    }
    sessionToRoom() {
      this.db.setRoom("currentSession", this.SESSION_ID);
    }
    updateVideoIndex(index) {
      this.db.set("currentStatus", {
        videoStartTimestamp: new Date().getTime(),
        videoIndex: index
      });
      this.session.currentStatus.videoStartTimestamp = new Date().getTime();
      this.session.currentStatus.videoIndex = index;
      this.updateTable();
    }
  };
  var sessionId = location.search.indexOf("session=") === -1 ? "" : location.search.substr(location.search.indexOf("session=") + "session=".length);
  if (sessionId) {
    const streamAdmin = new IeeeVisStreamAdmin(sessionId);
    document.getElementById("wrapper").style.display = "block";
  } else {
    document.getElementById("param-error").style.display = "block";
  }
})();
//# sourceMappingURL=admin-bundle.js.map
