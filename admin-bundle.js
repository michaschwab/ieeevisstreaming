(() => {
  // ieeevisdb.ts
  var IeeeVisDb = class {
    constructor(SESSION_ID, onData) {
      this.SESSION_ID = SESSION_ID;
      this.onData = onData;
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
    loadData() {
      this.sessionRef = firebase.database().ref("sessions/" + this.SESSION_ID);
      this.sessionRef.on("value", (snapshot) => {
        this.onData(snapshot.val());
      });
    }
    set(path, value) {
      this.sessionRef.child(path).set(value);
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
  var _IeeeVisStreamAdmin = class {
    constructor() {
      this.db = new IeeeVisDb(_IeeeVisStreamAdmin.SESSION_ID, this.onData.bind(this));
      this.db.loadData();
      new IeeeVisAuth();
      document.getElementById("previous-video-button").onclick = this.previousVideo.bind(this);
      document.getElementById("next-video-button").onclick = this.nextVideo.bind(this);
      setInterval(this.updateTable.bind(this), 1e3);
    }
    onData(track) {
      this.data = track;
      document.getElementById("track-title").innerText = this.data.name;
    }
    updateTable() {
      if (!this.data) {
        return;
      }
      const tableBody = document.getElementById("videos-table-body");
      tableBody.innerHTML = "";
      const currentVideoPlayedMs = new Date().getTime() - this.data.currentStatus.videoStartTimestamp;
      for (const videoKey in this.data.videos) {
        const video = this.data.videos[videoKey];
        const active = this.data.currentStatus.videoIndex.toString() === videoKey;
        const timePlayed = !active ? "-" : new Date(currentVideoPlayedMs).toISOString().substr(11, 8);
        const ytUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
        const tr = document.createElement("tr");
        tr.className = active ? "active" : "";
        tr.innerHTML = `
                <td><a href=${ytUrl}" target="_blank">${video.title}</a></td>
                <td>${video.type}</td>
                <td>${timePlayed}</td>`;
        tableBody.append(tr);
      }
    }
    previousVideo() {
      this.updateVideoIndex(this.data.currentStatus.videoIndex - 1);
    }
    nextVideo() {
      this.updateVideoIndex(this.data.currentStatus.videoIndex + 1);
    }
    updateVideoIndex(index) {
      this.db.set("currentStatus", {
        videoStartTimestamp: new Date().getTime(),
        videoIndex: index
      });
      this.data.currentStatus.videoStartTimestamp = new Date().getTime();
      this.data.currentStatus.videoIndex = index;
      this.updateTable();
    }
  };
  var IeeeVisStreamAdmin = _IeeeVisStreamAdmin;
  IeeeVisStreamAdmin.SESSION_ID = location.search.substr(location.search.indexOf("session=") + "session=".length);
  var streamAdmin = new IeeeVisStreamAdmin();
})();
//# sourceMappingURL=admin-bundle.js.map
