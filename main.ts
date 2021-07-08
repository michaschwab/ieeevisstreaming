import {Track} from "./track";
import {PlayerState, YoutubePlayer} from "./youtubeplayer";
import {IeeeVisDb} from "./ieeevisdb";

declare var YT;

class IeeeVisStream {
    static PLAYER_ELEMENT_ID = 'ytplayer';
    private playerIframe: HTMLIFrameElement;

    data: Track;
    player: YoutubePlayer;
    db: IeeeVisDb;

    youtubeApiReady = false;
    youtubePlayerLoaded = false;
    youtubePlayerReady = false;

    width = window.innerWidth;
    height = window.innerHeight - 100; // 80px for title

    CHAT_WIDTH_PERCENT = 30;
    CHAT_PADDING_LEFT_PX = 20;
    GATHERTOWN_HEIGHT_PERCENT = 40;

    constructor() {
        this.db = new IeeeVisDb(this.onData.bind(this));
        this.initYoutube();
        this.db.loadData();

        this.loadDiscord();
        this.loadGathertown();
        console.log(this);
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
        this.youtubePlayerReady = true;

        // Autoplay
        this.playerIframe = document.getElementById(IeeeVisStream.PLAYER_ELEMENT_ID) as HTMLIFrameElement;
        this.playerIframe.setAttribute('allow', "accelerometer; autoplay *; clipboard-write; encrypted-media; gyroscope; picture-in-picture");

        this.playerIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    }

    lastForcedSeek = 0;

    onPlayerStateChange(state: {target: YoutubePlayer, data: PlayerState}) {
        //document.getElementById(IeeeVisStream.PLAYER_ELEMENT_ID).style.pointerEvents = 'none';

        if(state.data === PlayerState.UNSTARTED) {
            // This is to force the player to go to 0 because it does not recognize 0 as a start time in loadVideoById.
            this.player.seekTo(this.getCurrentStartTimeS(), true);
        }

        if(state.data === PlayerState.PAUSED) {
            //this.player.playVideo();
            //this.player.seekTo(this.getCurrentStartTimeS(), true);
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

        this.player = new YT.Player(IeeeVisStream.PLAYER_ELEMENT_ID, {
            width: this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100,
            height: this.height * (100 - this.GATHERTOWN_HEIGHT_PERCENT) / 100,
            videoId: this.getCurrentYtId(),

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

    loadDiscord() {
        const html = `<iframe src="https://titanembeds.com/embed/851543399982170163?defaultchannel=851543400461107241"
                              width="${this.width * this.CHAT_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX}"
                              height="${this.height - 400}"
                              frameborder="0"></iframe>`;
        document.getElementById('discord-wrap').innerHTML += html;
    }

    loadGathertown() {
        const html = `<iframe title="gather town"
                              width="${this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100}"
                              height="${this.height * (this.GATHERTOWN_HEIGHT_PERCENT) / 100}"
                              allow="camera;microphone"
                              src="https://gather.town/app/NCPq3ewRqxrhEGTe/vis21-demo-test"></iframe>`;
        document.getElementById('yt-gathertown').style.width = `${this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100}px`
        document.getElementById('yt-gathertown').innerHTML += html;
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
        // The seeking in the following line does not work for 0 (see workaround above).
        this.player.loadVideoById(this.getCurrentYtId(), this.getCurrentStartTimeS());
        this.player.playVideo();
        this.lastForcedSeek = 0;
    }

    getCurrentVideo() {
        return this.data?.videos[this.data?.currentStatus?.videoIndex];
    }

    getCurrentYtId() {
        return this.getCurrentVideo()?.youtubeId;
    }

    getCurrentStartTimeS() {
        if(this.getCurrentVideo().type === 'prerecorded' || !this.youtubePlayerReady) {
            const timeMs = new Date().getTime();
            const videoStartTimestampMs = this.data?.currentStatus?.videoStartTimestamp;

            return Math.round((timeMs - videoStartTimestampMs) / 1000);
        } else if(this.getCurrentVideo().type === 'live') {
            return this.player.getDuration();
        }
    }
}

const stream = new IeeeVisStream();
export declare var onYouTubeIframeAPIReady;

onYouTubeIframeAPIReady = () => {
    stream.onYouTubeIframeAPIReady();
}