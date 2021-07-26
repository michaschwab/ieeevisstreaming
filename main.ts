import {Track} from "./track";
import {PlayerState, YoutubePlayer} from "./youtubeplayer";
import {IeeeVisDb} from "./ieeevisdb";

declare var YT;
type PANEL_TAB = "slido" | "discord";

class IeeeVisStream {
    static PLAYER_ELEMENT_ID = 'ytplayer';
    static CONTENT_WRAPPER_ID = 'content';
    static GATHERTOWN_WRAPPER_ID = 'gathertown';
    static PANEL_HEADER_ID = 'panel-header';

    data: Track;
    player: YoutubePlayer;
    db: IeeeVisDb;
    audioContext = new AudioContext();

    youtubeApiReady = false;
    youtubePlayerLoaded = false;
    youtubePlayerReady = false;

    slidoLoaded = false;
    discordLoaded = false;

    width = window.innerWidth;
    height = window.innerHeight - 120; // 80px for title

    CHAT_WIDTH_PERCENT = 40;
    CHAT_PADDING_LEFT_PX = 20;
    GATHERTOWN_HEIGHT_PERCENT = 40;
    static HEADERS_HEIGHT = 30;

    currentPanelTab: PANEL_TAB = "discord";

    constructor() {
        this.db = new IeeeVisDb(this.onData.bind(this));
        this.initYoutube();
        this.db.loadData();

        this.loadGathertown();
        this.initPanelTabs();
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

        this.player = new YT.Player(IeeeVisStream.PLAYER_ELEMENT_ID, {
            width: this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100,
            height: (this.height - IeeeVisStream.HEADERS_HEIGHT * 2) * (100 - this.GATHERTOWN_HEIGHT_PERCENT) / 100,
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
        this.discordLoaded = true;
        const html = `<iframe src="https://titanembeds.com/embed/${this.getDiscordGuildId()}?defaultchannel=${this.getDiscordChannelId()}"
                              width="${this.width * this.CHAT_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX}"
                              height="${this.height - IeeeVisStream.HEADERS_HEIGHT}"
                              frameborder="0"></iframe>`;
        document.getElementById('discord-wrap').innerHTML += html;
    }

    loadSlido() {
        this.slidoLoaded = true;
        const html = `<iframe id="slido-frame"
                        src="https://app.sli.do/event/${this.getSlidoURL()}"
                        width="${this.width * this.CHAT_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX}"
                        height="${this.height - IeeeVisStream.HEADERS_HEIGHT}"
                        frameBorder="0"
                        style="min-height: 400px;"
                        title="Slido"></iframe>`;
        document.getElementById('slido-wrap').innerHTML += html;
    }

    loadGathertown() {
        const html = `<iframe title="gather town"
                              width="${this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100}"
                              height="${(this.height - IeeeVisStream.HEADERS_HEIGHT * 2) * (this.GATHERTOWN_HEIGHT_PERCENT) / 100}"
                              allow="camera;microphone"
                              src="https://gather.town/app/aDeS7vVGW5A2wuF5/vis21-tech2"></iframe>`;

        const contentWrap = document.getElementById(IeeeVisStream.CONTENT_WRAPPER_ID);
        contentWrap.style.width = `${this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100}px`;

        const gatherWrap = document.getElementById(IeeeVisStream.GATHERTOWN_WRAPPER_ID);
        gatherWrap.innerHTML = html;
    }

    onData(track: Track) {
        const lastYtId = this.getCurrentYtId();
        this.data = track;
        
        if (!this.discordLoaded) {
            this.loadDiscord();
        }
        if (!this.slidoLoaded) {
            this.loadSlido();
        }

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

    getSlidoURL() {
        return this.data?.slido;
    }

    getDiscordGuildId() {
        return this.data?.discordGuildId; 
    }

    getDiscordChannelId() {
        return this.data?.discordChannelId; 
    }

    initPanelTabs() {
        const getToggle = (tabName: PANEL_TAB) => () => {
            console.log(tabName);
            this.currentPanelTab = tabName;

            document.getElementById('discord-tab-link').className = '';
            document.getElementById('slido-tab-link').className = '';
            document.getElementById(`${tabName}-tab-link`).className = 'active';

            document.getElementById('discord-wrap').className = '';
            document.getElementById('slido-wrap').className = '';
            document.getElementById(`${tabName}-wrap`).className = 'active';
        };

        document.getElementById('discord-tab-link').onclick = getToggle('discord');
        document.getElementById('slido-tab-link').onclick = getToggle('slido');

    }
}

const stream = new IeeeVisStream();
export declare var onYouTubeIframeAPIReady;

onYouTubeIframeAPIReady = () => {
    stream.onYouTubeIframeAPIReady();
}
