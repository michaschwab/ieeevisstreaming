import {Room, Session} from "./session";

declare var firebase: Firebase;

export class IeeeVisDb {
    private sessionRef?: FirebaseRef;

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

    loadRoom(roomId: string, onRoomUpdated: (room: Room) => void) {
        const roomRef = firebase.database().ref('rooms/' + roomId) as FirebaseRef;

        roomRef.on('value', (snapshot) => {
            onRoomUpdated(snapshot.val() as Room);
        });
    }

    loadSession(sessionId: string, onSessionUpdated: (session: Session) => void) {
        this.sessionRef = firebase.database().ref('sessions/' + sessionId);

        this.sessionRef!.on('value', (snapshot) => {
            onSessionUpdated(snapshot.val() as Session);
        });
    }

    set(path: string, value: string|number|{}) {
        this.sessionRef?.child(path).set(value);
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