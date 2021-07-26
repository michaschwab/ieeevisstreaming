import {Track} from "./track";

declare var firebase;

export class IeeeVisDb {
    private trackRef: FirebaseRef;

    constructor(private onData: (track: Track) => void) {
        this.initFirebase();
    }

    initFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyD2GFrQJM0w0eK85jjfANn1BUdlv3CJVvc",
            authDomain: "vis21-viewer-test.firebaseapp.com",
            projectId: "vis21-viewer-test",
            storageBucket: "vis21-viewer-test.appspot.com",
            messagingSenderId: "1047491864011",
            appId: "1:1047491864011:web:9af419c7eeec148e44824e"
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

    set(path: string, value: string|number|{}) {
        this.trackRef.child(path).set(value);
    }
}

interface FirebaseRef {
    child: (childName: string) => FirebaseRef;
    set: (value: string|number|{}) => void;
    on: (event: "value", cb: (data: any) => void) => void;
}
