import {PlayerState, YoutubePlayer} from "./youtubeplayer";
import {Video, VideoStatus} from "./session";

declare var YT;

export class IeeeVisVideoPlayer {
    player: YoutubePlayer;
    audioContext = new AudioContext();

    youtubeApiReady = false;
    youtubePlayerLoaded = false;
    youtubePlayerReady = false;

    constructor(private elementId: string,
                private width: number,
                private height: number,
                private getCurrentVideo: () => Video,
                private getCurrentVideoId: () => string,
                private getCurrentVideoStatus: () => VideoStatus) {
        this.init();
    }

    onYouTubeIframeAPIReady() {
        this.youtubeApiReady = true;
    }

    init() {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    onPlayerReady() {
        console.log('player ready', this.player);
        this.youtubePlayerReady = true;

        if(this.audioContext.state === "suspended") {
            this.player.mute();
        }
        this.player.playVideo();
    }


    lastForcedSeek = 0;

    onPlayerStateChange(state: {target: YoutubePlayer, data: PlayerState}) {
        if(state.data === PlayerState.UNSTARTED) {
            // This is to force the player to go to 0 because it does not recognize 0 as a start time in loadVideoById.
            this.player.seekTo(this.getCurrentStartTimeS(), true);
        }

        if(state.data === PlayerState.PLAYING || state.data === PlayerState.BUFFERING) {
            const startTime = this.getCurrentStartTimeS();
            const currentTime = this.player.getCurrentTime();
            if(Math.abs(startTime - currentTime) > 5 && Date.now() - this.lastForcedSeek > 10000) {
                this.player.seekTo(this.getCurrentStartTimeS(), true);
                console.log('lagging behind. seek.', this.getCurrentStartTimeS(), this.player.getCurrentTime());
                this.lastForcedSeek = Date.now();
            }
        }
    }

    loadYoutubePlayer() {
        this.youtubePlayerLoaded = true;

        this.player = new YT.Player(this.elementId, {
            width: this.width,
            height: this.height,
            videoId: this.getCurrentVideoId(),

            playerVars: {
                'playsinline': 1,
                'autoplay': 1,
                'controls': 1,
                'rel': 0,
                'modestbranding': 1,
                'mute': 0,
                start: this.getCurrentStartTimeS(),
            },
            events: {
                'onReady': this.onPlayerReady.bind(this),
                'onStateChange': this.onPlayerStateChange.bind(this),
            }
        });
    }

    updateVideo() {
        if(!this.getCurrentVideoId() || !this.youtubeApiReady) {
            return;
        }

        if(!this.youtubePlayerLoaded) {
            this.loadYoutubePlayer();
        } else {
            this.changeYoutubeVideo();
        }
    }

    changeYoutubeVideo() {
        // The seeking in the following line does not work for 0 (see workaround above).
        this.player.loadVideoById(this.getCurrentVideoId(), this.getCurrentStartTimeS());
        this.player.playVideo();
        this.lastForcedSeek = 0;
    }

    getCurrentStartTimeS() {
        if(this.getCurrentVideo().type === 'prerecorded' || !this.youtubePlayerReady) {
            const timeMs = new Date().getTime();
            const videoStartTimestampMs = this.getCurrentVideoStatus()?.videoStartTimestamp;

            return Math.round((timeMs - videoStartTimestampMs) / 1000);
        } else if(this.getCurrentVideo().type === 'live') {
            return this.player.getDuration();
        }
    }
}