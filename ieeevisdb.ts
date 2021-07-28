import {Session} from "./session";

declare var firebase;

export class IeeeVisDb {
    private sessionRef: FirebaseRef;

    constructor(private SESSION_ID: string, private onData: (session: Session) => void) {
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
        this.sessionRef = firebase.database().ref('sessions/' + this.SESSION_ID) as FirebaseRef;

        this.sessionRef.on('value', (snapshot) => {
            this.onData(snapshot.val() as Session);
        });
    }

    set(path: string, value: string|number|{}) {
        this.sessionRef.child(path).set(value);
    }
}

interface FirebaseRef {
    child: (childName: string) => FirebaseRef;
    set: (value: string|number|{}) => void;
    on: (event: "value", cb: (data: any) => void) => void;
}