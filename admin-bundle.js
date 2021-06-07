(() => {
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

  // main-admin.ts
  var IeeeVisStreamAdmin = class {
    constructor() {
      this.db = new IeeeVisDb(this.onData.bind(this));
      this.db.loadData();
      document.getElementById("previous-video-button").onclick = this.previousVideo.bind(this);
      document.getElementById("next-video-button").onclick = this.nextVideo.bind(this);
      setInterval(this.updateTable.bind(this), 1e3);
    }
    onData(track) {
      this.data = track;
      document.getElementById("track-title").innerText = this.data.name;
    }
    updateTable() {
      const tableBody = document.getElementById("videos-table-body");
      tableBody.innerHTML = "";
      const currentVideoPlayedMs = new Date().getTime() - this.data.currentStatus.videoStartTimestamp;
      for (const videoKey in this.data.videos) {
        const video = this.data.videos[videoKey];
        const active = this.data.currentStatus.videoIndex.toString() === videoKey;
        const timePlayed = !active ? "-" : new Date(currentVideoPlayedMs).toISOString().substr(11, 8);
        const tr = document.createElement("tr");
        tr.className = active ? "active" : "";
        tr.innerHTML = `<td><a href="https://www.youtube.com/watch?v=${video.youtubeId}" target="_blank">${video.title}</a></td><td>${video.type}</td><td>${timePlayed}</td>`;
        tableBody.append(tr);
      }
    }
    previousVideo() {
      const nextIndex = this.data.currentStatus.videoIndex - 1;
      this.db.set("currentStatus/videoIndex", nextIndex);
      this.db.set("currentStatus/videoStartTimestamp", new Date().getTime());
    }
    nextVideo() {
      const nextIndex = this.data.currentStatus.videoIndex + 1;
      this.db.set("currentStatus/videoIndex", nextIndex);
      this.db.set("currentStatus/videoStartTimestamp", new Date().getTime());
    }
  };
  var streamAdmin = new IeeeVisStreamAdmin();
})();
