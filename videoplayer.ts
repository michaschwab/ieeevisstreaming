import {PlayerState, YoutubePlayer} from "./youtubeplayer";
import {SessionStage, SessionStatus} from "./session";

declare var YT: YouTube;

export class IeeeVisVideoPlayer {
    player?: YoutubePlayer;
    audioContext = new AudioContext();

    private width = 400;
    private height = 300;

    youtubeApiReady = false;
    youtubePlayerLoaded = false;
    youtubePlayerReady = false;

    private lastVideoId? = '';

    constructor(private elementId: string,
                private getCurrentStage: OmitThisParameter<() => (SessionStage | undefined)>,
                private getCurrentVideoId: OmitThisParameter<() => string | undefined>,
                private getCurrentSessionStatus: () => (SessionStatus | undefined)) {
        this.init();
    }

    onYouTubeIframeAPIReady() {
        this.youtubeApiReady = true;
    }

    updateVideo() {
        if(!this.youtubeApiReady) {
            return;
        }
        const currentVideoId = this.getCurrentVideoId();

        if(!this.youtubePlayerLoaded) {
            this.loadYoutubePlayer();
        } else {
            if(!currentVideoId && this.player) {
                this.player.stopVideo();
            } else {
                if(currentVideoId && this.lastVideoId !== currentVideoId) {
                    this.changeYoutubeVideo();
                }
            }
        }
        this.lastVideoId = currentVideoId;
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
        firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
    }

    private onPlayerReady() {
        console.log('player ready', this.player);
        this.youtubePlayerReady = true;

        if(this.audioContext.state === "suspended") {
            this.player!.mute();
        }
        this.player!.playVideo();

        this.updateVideo();
    }

    private lastCatchupChecksLedToCatchup: boolean[] = [];

    private onPlayerStateChange(state: {target: YoutubePlayer, data: PlayerState}) {
        if(!this.getCurrentVideoId()) {
            return;
        }
        if(state.data === PlayerState.UNSTARTED) {
            // This is to force the player to go to 0 because it does not recognize 0 as a start time in loadVideoById.
            this.player!.seekTo(this.getCurrentStartTimeS() || 0, true);
        }

        if(state.data === PlayerState.PLAYING || state.data === PlayerState.BUFFERING) {
            const startTime = this.getCurrentStartTimeS() || 0;
            const currentTime = this.player!.getCurrentTime();
            const shouldCatchUp = Math.abs(startTime - currentTime) > 5;

            this.lastCatchupChecksLedToCatchup.push(shouldCatchUp);
            const consideredChecks = 4;
            this.lastCatchupChecksLedToCatchup = this.lastCatchupChecksLedToCatchup.slice(-1 * consideredChecks); // Last 4 checks
            const numChecks = this.lastCatchupChecksLedToCatchup.length;
            const enoughChecks = numChecks >= consideredChecks;
            const notAllLastChecksForcedCatchup = this.lastCatchupChecksLedToCatchup.indexOf(false) !== -1;

            if(shouldCatchUp && (notAllLastChecksForcedCatchup || !enoughChecks)) {
                this.player!.seekTo(startTime, true);
                console.log('lagging behind. seek.', this.getCurrentStartTimeS(), this.player!.getCurrentTime(), this.player!.getDuration(), this.player);
            }
            if(shouldCatchUp && !notAllLastChecksForcedCatchup) {
                console.log('would normally catch up now, but skipping to prevent multi-seek.', this.lastCatchupChecksLedToCatchup, numChecks, enoughChecks);
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
        const currentVideoId = this.getCurrentVideoId();
        if(!currentVideoId) {
            return;
        }
        this.player!.loadVideoById(currentVideoId, this.getCurrentStartTimeS());
        this.player!.playVideo();
    }

    private getCurrentStartTimeS() {
        if(!this.getCurrentStage()!.live || !this.youtubePlayerReady) {
            const timeMs = new Date().getTime();
            const videoStartTimestampMs = this.getCurrentSessionStatus()?.videoStartTimestamp || 0;

            return Math.round((timeMs - videoStartTimestampMs) / 1000);
        } else if(this.getCurrentStage()!.live) {
            const videoStartTimestampMs = this.getCurrentSessionStatus()?.liveStreamStartTimestamp;
            if(!videoStartTimestampMs) {
                return 0;
            }
            const timeDiffMs = new Date().getTime() - videoStartTimestampMs;
            return Math.round(timeDiffMs / 1000);
        }
    }
}

interface YouTube {
    Player: YouTubePlayerConstructor;
}

interface YouTubePlayerConstructor {
    new(elementId: string, data: any): YoutubePlayer
}
