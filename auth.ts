import {Track} from "./track";

declare var firebase;
declare var firebaseui;

export class IeeeVisAuth {
    constructor() {
        this.initFirebaseUi();
    }

    initFirebaseUi() {
        var uiConfig = {
            signInSuccessUrl: 'http://localhost:8080/admin',
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
}
