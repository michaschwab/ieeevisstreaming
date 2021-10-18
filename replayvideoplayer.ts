import {PlayerState, YoutubePlayer} from "./youtubeplayer";

declare var YT: YouTube;

export class IeeeVisReplayVideoPlayer {
    player?: YoutubePlayer;
    audioContext = new AudioContext();

    private width = 400;
    private height = 300;

    youtubeApiReady = false;
    youtubePlayerLoaded = false;
    youtubePlayerReady = false;

    constructor(private elementId: string,
                private getCurrentVideoId: OmitThisParameter<() => string | undefined>,
                private getStartEndTimes: () => [number, number]) {
        this.init();
    }

    onYouTubeIframeAPIReady() {
        this.youtubeApiReady = true;
    }

    updateVideo() {
        if(!this.youtubeApiReady) {
            return;
        }

        if(!this.youtubePlayerLoaded) {
            this.loadYoutubePlayer();
        } else {
            if(!this.getCurrentVideoId() && this.player) {
                this.player.stopVideo();
            } else {
                this.changeYoutubeVideo();
            }
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
        firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
    }

    private onPlayerReady() {
        console.log('player ready', this.player, this.getCurrentVideoId());
        this.youtubePlayerReady = true;

        console.log(this.audioContext);
        if(this.audioContext.state === "suspended") {
            this.player!.mute();
        }
        this.player!.playVideo();


        this.updateVideo();
    }

    private onPlayerStateChange(state: {target: YoutubePlayer, data: PlayerState}) {
        // if(state.data === PlayerState.UNSTARTED) {
        //     // This is to force the player to go to 0 because it does not recognize 0 as a start time in loadVideoById.
        //     this.player!.seekTo(this.getCurrentStartTimeS() || 0, true);
        // }

        // if(state.data === PlayerState.PLAYING || state.data === PlayerState.BUFFERING) {
        //     const [startTime] = this.getStartEndTimes();
        //     const currentTime = this.player!.getCurrentTime();
        //     if(Math.abs(startTime - currentTime) > 5) {
        //         this.player!.seekTo(startTime, true);
        //         console.log('lagging behind. seek.', this.getCurrentStartTimeS(), this.player!.getCurrentTime(), this.player!.getDuration(), this.player);
        //     }
        // }
    }

    private loadYoutubePlayer() {
        this.youtubePlayerLoaded = true;
        const [start, end] = this.getStartEndTimes();
        console.log('loadYoutubePlayer');

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
                start,
                end
            },
            events: {
                'onReady': this.onPlayerReady.bind(this),
                'onStateChange': this.onPlayerStateChange.bind(this),
            }
        });
    }

    private changeYoutubeVideo() {
        // The seeking in the following line does not work for 0 (see workaround above).
        const [startSeconds, endSeconds] = this.getStartEndTimes();
        this.player!.loadVideoById({videoId: this.getCurrentVideoId()!, startSeconds, endSeconds});
        //console.log('test', startSeconds, endSeconds, {videoId: this.getCurrentVideoId()!, startSeconds, endSeconds, start: startSeconds, end: endSeconds});
        this.player!.playVideo();
    }

    private getCurrentStartTimeS() {
        return this.getStartEndTimes()[0];
        // const timeMs = new Date().getTime();
        // const videoStartTimestampMs = this.getCurrentSessionStatus()?.videoStartTimestamp || 0;
        //
        // return Math.round((timeMs - videoStartTimestampMs) / 1000);
        //return 0;
    }
}

interface YouTube {
    Player: YouTubePlayerConstructor;
}

interface YouTubePlayerConstructor {
    new(elementId: string, data: any): YoutubePlayer
}
