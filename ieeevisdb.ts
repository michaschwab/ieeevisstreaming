import {AdminsData, Log, Room, RoomDayLogs, Session} from "./session";

declare var firebase: Firebase;

export class IeeeVisDb {
    private sessionRef?: FirebaseRef;
    private roomRef?: FirebaseRef;
    private adminsRef?: FirebaseRef;
    private logsRef?: FirebaseRef;

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

        this.logsRef = firebase.database().ref('logs/');
    }

    loadRoom(roomId: string, onRoomUpdated: (room: Room) => void) {
        this.roomRef = firebase.database().ref('rooms/' + roomId) as FirebaseRef;

        this.roomRef.on('value', (snapshot) => {
            onRoomUpdated(snapshot.val() as Room);
        });
    }

    loadSession(sessionId: string, onSessionUpdated: (session: Session) => void) {
        this.sessionRef = firebase.database().ref('sessions/' + sessionId);

        this.sessionRef!.on('value', (snapshot) => {
            onSessionUpdated(snapshot.val() as Session);
        });
    }

    loadAdmins(callback: (adminsData: AdminsData) => void) {
        this.adminsRef = firebase.database().ref('admins');

        this.adminsRef!.on('value', (snapshot) => {
            callback(snapshot.val() as AdminsData);
        });
    }

    set(path: string, value: string|number|{}) {
        this.sessionRef?.child(path).set(value);
    }

    setRoom(path: string, value: string|number) {
        this.roomRef?.child(path).set(value);
    }

    log(log: Log) {
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

    loadLogs(room: string, day: string, callback: (logs: RoomDayLogs) => void) {
        const logsRef = firebase.database().ref(`logs/${day}/${room}`);

        logsRef!.on('value', (snapshot) => {
            callback(snapshot.val() as RoomDayLogs);
        });
    }
}

interface FirebaseRef {
    child: (childName: string) => FirebaseRef;
    set: (value: string|number|{}) => void;
    on: (event: "value", cb: (data: any) => void) => void;
}

interface Firebase {
    initializeApp: (data: {
        apiKey: string,
        authDomain: string,
        databaseURL: string,
        projectId: string,
        storageBucket: string,
        messagingSenderId: string,
        appId: string,
        measurementId: string
    }) => void;
    analytics: () => void;
    database: () => {
        ref: (name: string) => FirebaseRef
    }
}
