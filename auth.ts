import {Session, User} from "./session";

declare var firebase: Firebase;
declare var firebaseui: FirebaseUiApi;

export class IeeeVisAuth {
    constructor(private onUser: (user?: User) => void) {
        this.initFirebaseUi();
        this.initUi();
        this.trackAuthState();
    }

    initFirebaseUi() {
        var uiConfig = {
            signInSuccessUrl: location,
            signInOptions: [
                // Leave the lines as is for the providers you want to offer your users.
                firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            ],
            tosUrl: '',
            // Privacy policy url/callback.
            privacyPolicyUrl: ''
        };

        // Initialize the FirebaseUI Widget using Firebase.
        // @ts-ignore
        const ui = new firebaseui.auth.AuthUI(firebase.auth());
        // The start method will wait until the DOM is loaded.
        ui.start('#firebaseui-auth-container', uiConfig);
    }

    initUi() {
        document.getElementById('welcome')!.style.display = 'none';
        document.getElementById('sign-out')!.addEventListener('click', function() {
            firebase.auth().signOut();
        });
    }

    trackAuthState() {
        firebase.auth().onAuthStateChanged((user?: User) => {
            if(user) {
                document.getElementById('welcome')!.style.display = '';
                document.getElementById('displayName')!.innerText = user.displayName;
                document.getElementById('firebaseui-auth-container')!.style.display = 'none';

            } else {
                document.getElementById('firebaseui-auth-container')!.style.display = '';
                document.getElementById('welcome')!.style.display = 'none';
                document.getElementById('displayName')!.innerText = '';
            }
            this.onUser(user);
        });
    }
}

interface Firebase {
    auth: FirebaseAuth;
}

interface FirebaseAuth {
    (): FirebaseAuthInstance;
    GoogleAuthProvider: {
        PROVIDER_ID: string;
    };
}

interface FirebaseAuthInstance {
    signOut: () => void;
    onAuthStateChanged: (callback: (user?: User) => void) => void;
}

interface FirebaseUiApi {
    auth: {
        AuthUI: (auth: FirebaseAuthInstance) => FirebaseUi;
    }
}

interface FirebaseUi {
    new(): any;
    start: (selector: string, config: {}) => void;
}
