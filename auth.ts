import {Session} from "./session";

declare var firebase;
declare var firebaseui;

export class IeeeVisAuth {
    private user?: User;

    constructor(private location: Location) {
        this.initFirebaseUi();
        this.initUi();
        this.trackAuthState();
    }

    initFirebaseUi() {
        var uiConfig = {
            signInSuccessUrl: this.location,
            signInOptions: [
                // Leave the lines as is for the providers you want to offer your users.
                firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            ],
            tosUrl: '',
            // Privacy policy url/callback.
            privacyPolicyUrl: ''
        };

        // Initialize the FirebaseUI Widget using Firebase.
        var ui = new firebaseui.auth.AuthUI(firebase.auth());
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
                console.log('logged in', user);
                this.user = user;
                document.getElementById('welcome')!.style.display = '';
                document.getElementById('displayName')!.innerText = this.user.displayName;
                document.getElementById('firebaseui-auth-container')!.style.display = 'none';
            } else {
                console.log('not logged in');
                document.getElementById('firebaseui-auth-container')!.style.display = '';
                document.getElementById('welcome')!.style.display = 'none';
                document.getElementById('displayName')!.innerText = '';
                this.user = undefined;
            }
        });
    }
}

interface User {
    displayName: string;
    email: string;
}