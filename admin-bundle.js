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
    set(path, value) {
      this.sessionRef?.child(path).set(value);
    }
    setRoom(path, value) {
      this.roomRef?.child(path).set(value);
    }
  };

  // auth.ts
  var IeeeVisAuth = class {
    constructor() {
      this.initFirebaseUi();
    }
    initFirebaseUi() {
      var uiConfig = {
        signInSuccessUrl: "http://localhost:8080/admin",
        signInOptions: [
          firebase.auth.GoogleAuthProvider.PROVIDER_ID
        ],
        tosUrl: "",
        privacyPolicyUrl: ""
      };
      var ui = new firebaseui.auth.AuthUI(firebase.auth());
      ui.start("#firebaseui-auth-container", uiConfig);
    }
  };

  // main-admin.ts
  var IeeeVisStreamAdmin = class {
    constructor(SESSION_ID) {
      this.SESSION_ID = SESSION_ID;
      this.db = new IeeeVisDb();
      this.db.loadSession(SESSION_ID, (session) => this.onSessionUpdated(session));
      new IeeeVisAuth();
      document.getElementById("previous-video-button").onclick = this.previousVideo.bind(this);
      document.getElementById("next-video-button").onclick = this.nextVideo.bind(this);
      document.getElementById("session-to-room-button").onclick = this.sessionToRoom.bind(this);
      setInterval(this.updateTable.bind(this), 1e3);
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
    }
    updateTable() {
      if (!this.session) {
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
        const tr = document.createElement("tr");
        tr.className = active ? "active" : "";
        tr.innerHTML = `
                <td>` + (isPreview ? `<a href="${imgUrl}" target="_blank">[Image]</a>` : `<a href=${ytUrl}" target="_blank">${stage.title}</a>`) + `
                </td>
                <td>${stage.live ? "yes" : "-"}</td>
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
