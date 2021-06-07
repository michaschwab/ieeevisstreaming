import {Track} from "./track";

declare var firebase;

export class IeeeVisDb {
    private trackRef: FirebaseRef;

    constructor(private onData: (track: Track) => void) {
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
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        firebase.analytics();
    }

    loadData() {
        this.trackRef = firebase.database().ref('tracks/track1') as FirebaseRef;

        this.trackRef.on('value', (snapshot) => {
            this.onData(snapshot.val() as Track);
        });
    }

    set(path: string, value: string|number) {
        this.trackRef.child(path).set(value);
    }
}

interface FirebaseRef {
    child: (childName: string) => FirebaseRef;
    set: (value: string|number) => void;
    on: (event: "value", cb: (data: any) => void) => void;
}