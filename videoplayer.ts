import {PlayerState, YoutubePlayer} from "./youtubeplayer";
import {Video, SessionStatus} from "./session";

declare var YT;

export class IeeeVisVideoPlayer {
    player: YoutubePlayer;
    audioContext = new AudioContext();

    private width = 400;
    private height = 300;

    youtubeApiReady = false;
    youtubePlayerLoaded = false;
    youtubePlayerReady = false;

    constructor(private elementId: string,
                private getCurrentVideo: () => Video,
                private getCurrentVideoId: () => string,
                private getCurrentVideoStatus: () => SessionStatus) {
        this.init();
    }

    onYouTubeIframeAPIReady() {
        this.youtubeApiReady = true;
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

    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;

        if(!this.player) {
            return;
        }
        this.player.setSize(width, height);
    }

    private init() {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    private onPlayerReady() {
        console.log('player ready', this.player);
        this.youtubePlayerReady = true;

        if(this.audioContext.state === "suspended") {
            this.player.mute();
        }
        this.player.playVideo();
    }

    private onPlayerStateChange(state: {target: YoutubePlayer, data: PlayerState}) {
        if(state.data === PlayerState.UNSTARTED) {
            // This is to force the player to go to 0 because it does not recognize 0 as a start time in loadVideoById.
            this.player.seekTo(this.getCurrentStartTimeS(), true);
        }

        if(state.data === PlayerState.PLAYING || state.data === PlayerState.BUFFERING) {
            const startTime = this.getCurrentStartTimeS();
            const currentTime = this.player.getCurrentTime();
            if(Math.abs(startTime - currentTime) > 5) {
                this.player.seekTo(this.getCurrentStartTimeS(), true);
                console.log('lagging behind. seek.', this.getCurrentStartTimeS(), this.player.getCurrentTime());
            }
        }
    }

    private loadYoutubePlayer() {
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

    private changeYoutubeVideo() {
        // The seeking in the following line does not work for 0 (see workaround above).
        this.player.loadVideoById(this.getCurrentVideoId(), this.getCurrentStartTimeS());
        this.player.playVideo();
    }

    private getCurrentStartTimeS() {
        if(this.getCurrentVideo().type === 'prerecorded' || !this.youtubePlayerReady) {
            const timeMs = new Date().getTime();
            const videoStartTimestampMs = this.getCurrentVideoStatus()?.videoStartTimestamp;

            return Math.round((timeMs - videoStartTimestampMs) / 1000);
        } else if(this.getCurrentVideo().type === 'live') {
            return this.player.getDuration();
        }
    }
}