import {Track} from "./track";
import {YoutubePlayer} from "./youtubeplayer";
import {IeeeVisDb} from "./ieeevisdb";

declare var YT;

class IeeeVisStream {
    static PLAYER_ELEMENT_ID = 'ytplayer';

    data: Track;
    player: YoutubePlayer;
    db: IeeeVisDb;

    youtubeApiReady = false;
    youtubePlayerLoaded = false;

    startedPlaying = false;

    constructor() {
        this.db = new IeeeVisDb(this.onData.bind(this));
        this.initYoutube();
        this.db.loadData();
    }

    initYoutube() {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    onYouTubeIframeAPIReady() {
        this.youtubeApiReady = true;
    }

    onPlayerReady() {
        console.log('player ready', this.player);

        // Autoplay
        const playerIframe = document.getElementById('ytplayer') as HTMLIFrameElement;
        playerIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    }

    onPlayerStateChange() {
        //document.getElementById(IeeeVisStream.PLAYER_ELEMENT_ID).style.pointerEvents = 'none';

        this.player.playVideo();
    }

    loadYoutubePlayer() {
        this.youtubePlayerLoaded = true;

        this.player = new YT.Player(IeeeVisStream.PLAYER_ELEMENT_ID, {
            height: '600',
            width: '1000',
            videoId: this.getCurrentYtId() + "?autoplay=1",

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

    onData(track: Track) {
        const lastYtId = this.getCurrentYtId();
        this.data = track;

        document.getElementById('track-title').innerText = this.data.name;

        if(this.getCurrentYtId() != lastYtId) {
            this.updateVideo();
        }
    }

    updateVideo() {
        if(!this.data || !this.getCurrentYtId() || !this.youtubeApiReady) {
            return;
        }

        if(!this.youtubePlayerLoaded) {
            this.loadYoutubePlayer();
        } else {
            this.changeYoutubeVideo();
        }
    }

    changeYoutubeVideo() {
        console.log('change yt vid');

        this.player.loadVideoById(this.getCurrentYtId(), this.getCurrentStartTimeS());
        this.player.playVideo();
    }

    getCurrentVideo() {
        return this.data?.videos[this.data?.currentStatus?.videoIndex];
    }

    getCurrentYtId() {
        return this.getCurrentVideo()?.youtubeId;
    }

    getCurrentStartTimeS() {
        const timeMs = new Date().getTime();
        const videoStartTimestampMs = this.data?.currentStatus?.videoStartTimestamp;
        const videoStartTimeS = this.data?.currentStatus?.videoStartTime;

        console.log(Math.round((timeMs - videoStartTimestampMs) / 1000) + videoStartTimeS, videoStartTimestampMs, videoStartTimeS);
        return Math.round((timeMs - videoStartTimestampMs) / 1000) + videoStartTimeS;
    }
}

const stream = new IeeeVisStream();
export declare var onYouTubeIframeAPIReady;

onYouTubeIframeAPIReady = () => {
    stream.onYouTubeIframeAPIReady();
}