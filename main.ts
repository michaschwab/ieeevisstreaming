import {Session, Video} from "./session";
import {IeeeVisDb} from "./ieeevisdb";
import {IeeeVisVideoPlayer} from "./videoplayer";

type PANEL_TAB = "slido" | "discord";

class IeeeVisStream {
    static PLAYER_ELEMENT_ID = 'ytplayer';
    static CONTENT_WRAPPER_ID = 'content';
    static GATHERTOWN_WRAPPER_ID = 'gathertown';
    static PANEL_HEADER_ID = 'panel-header';
    static SESSION_ID = location.search.substr(location.search.indexOf('session=') + 'session='.length);

    data: Session;
    player: IeeeVisVideoPlayer;
    db: IeeeVisDb;

    width = window.innerWidth;
    height = window.innerHeight - 120; // 80px for title

    CHAT_WIDTH_PERCENT = 40;
    CHAT_PADDING_LEFT_PX = 20;
    GATHERTOWN_HEIGHT_PERCENT = 40;
    static HEADERS_HEIGHT = 30;

    currentPanelTab: PANEL_TAB = "discord";

    constructor() {
        console.log(IeeeVisStream.SESSION_ID);
        this.db = new IeeeVisDb(IeeeVisStream.SESSION_ID, this.onData.bind(this));
        this.player = new IeeeVisVideoPlayer(IeeeVisStream.PLAYER_ELEMENT_ID,
            this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100,
            (this.height - IeeeVisStream.HEADERS_HEIGHT * 2) * (100 - this.GATHERTOWN_HEIGHT_PERCENT) / 100,
            this.getCurrentVideo.bind(this),
            this.getCurrentVideoId.bind(this),
            () => this.data?.currentStatus);
        this.db.loadData();

        this.loadDiscord();
        this.loadSlido();
        this.loadGathertown();
        this.initPanelTabs();
    }

    onYouTubeIframeAPIReady() {
        this.player.onYouTubeIframeAPIReady();
    }

    loadDiscord() {
        const html = `<iframe src="https://titanembeds.com/embed/851543399982170163?defaultchannel=851543400461107241"
                              width="${this.width * this.CHAT_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX}"
                              height="${this.height - IeeeVisStream.HEADERS_HEIGHT}"
                              frameborder="0"></iframe>`;
        document.getElementById('discord-wrap').innerHTML += html;
    }

    loadSlido() {
        const frame = document.getElementById('slido-frame');
        frame.setAttribute('width', `${this.width * this.CHAT_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX}`);
        frame.setAttribute('height', `${this.height - IeeeVisStream.HEADERS_HEIGHT}`);
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

    onData(session: Session) {
        const lastYtId = this.getCurrentVideoId();
        this.data = session;

        document.getElementById('track-title').innerText = this.data.name;

        if(this.getCurrentVideoId() != lastYtId) {
            this.player.updateVideo();
        }
    }

    getCurrentVideo(): Video {
        return this.data?.videos[this.data?.currentStatus?.videoIndex];
    }

    getCurrentVideoId() {
        return this.getCurrentVideo()?.youtubeId;
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