import {Session, SessionState, Video} from "./session";
import {IeeeVisDb} from "./ieeevisdb";
import {IeeeVisVideoPlayer} from "./videoplayer";

type PANEL_TAB = "slido" | "discord";

class IeeeVisStream {
    static PLAYER_ELEMENT_ID = 'ytplayer';
    static CONTENT_WRAPPER_ID = 'content';
    static GATHERTOWN_WRAPPER_ID = 'gathertown';
    static SESSION_ID = location.search.substr(location.search.indexOf('session=') + 'session='.length);

    data: Session;
    player: IeeeVisVideoPlayer;
    db: IeeeVisDb;

    width = window.innerWidth;
    height = window.innerHeight;

    CHAT_WIDTH_PERCENT = 40;
    CHAT_PADDING_LEFT_PX = 20;
    static HEADERS_HEIGHT = 40;

    currentPanelTab: PANEL_TAB = "discord";

    constructor() {
        this.db = new IeeeVisDb(IeeeVisStream.SESSION_ID, this.onData.bind(this));
        this.player = new IeeeVisVideoPlayer(IeeeVisStream.PLAYER_ELEMENT_ID,
            this.getCurrentVideo.bind(this),
            this.getCurrentVideoId.bind(this),
            () => this.data?.currentStatus);
        this.db.loadData();

        this.loadGathertown();
        this.initPanelTabs();

        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
    }

    onYouTubeIframeAPIReady() {
        this.player.onYouTubeIframeAPIReady();
    }

    loadChat() {
        const discordUrl = `https://titanembeds.com/embed/851543399982170163?defaultchannel=${this.data.discord}`;
        const rocketUrl = `https://chat.wushernet.com/channel/${this.data.rocketchat}?layout=embedded`;
        const url = location.hash.indexOf('discord') === -1 ? rocketUrl : discordUrl;
        const html = `<iframe src="${url}" id="discord-iframe" frameborder="0"></iframe>`;
        document.getElementById('discord-wrap').innerHTML += html;
    }

    loadSlido() {
        const frame = document.getElementById('slido-frame');
        frame.setAttribute('src', `https://app.sli.do/event/${this.data.slido}`);
    }

    loadGathertown() {
        const html = `<iframe title="gather town"
                              allow="camera;microphone"
                              id="gathertown-iframe"
                              src="https://gather.town/app/aDeS7vVGW5A2wuF5/vis21-tech2"></iframe>`;

        const gatherWrap = document.getElementById(IeeeVisStream.GATHERTOWN_WRAPPER_ID);
        gatherWrap.innerHTML = html;
    }

    onData(session: Session) {
        const initializing = this.data === null || this.data === undefined;
        const lastYtId = this.getCurrentVideoId();
        this.data = session;

        document.getElementById('track-title').innerText = this.data.name;
        document.getElementById('video-name').innerText = this.getCurrentVideo()?.title;

        if(this.getCurrentVideoId() != lastYtId) {
            this.player.updateVideo();
        }

        if(initializing) {
            this.loadChat();
            this.loadSlido();
        }
        this.resize();
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
            this.updatePanelTabs();
        };

        document.getElementById('discord-tab-link').onclick = getToggle('discord');
        document.getElementById('slido-tab-link').onclick = getToggle('slido');
    }

    updatePanelTabs() {
        document.getElementById('discord-tab-link').className = '';
        document.getElementById('slido-tab-link').className = '';
        document.getElementById(`${this.currentPanelTab}-tab-link`).className = 'active';

        document.getElementById('discord-wrap').className = '';
        document.getElementById('slido-wrap').className = '';
        document.getElementById(`${this.currentPanelTab}-wrap`).className = 'active';
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight - 65; // 40px for title

        const state = this.getCurrentVideo()?.state;
        const gathertownHeightPercent = state === "SOCIALIZING" ? 65 : 35;

        const playerWidth = this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100;
        const playerHeight = (this.height - IeeeVisStream.HEADERS_HEIGHT * 2) * (100 - gathertownHeightPercent) / 100;
        this.player.setSize(playerWidth, playerHeight);

        const gatherFrame = document.getElementById('gathertown-iframe');
        const gatherWidth = this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100;
        const gatherHeight=(this.height - IeeeVisStream.HEADERS_HEIGHT * 2) * gathertownHeightPercent / 100;
        gatherFrame.setAttribute('width', `${gatherWidth}`);
        gatherFrame.setAttribute('height', `${gatherHeight}`);

        const contentWrap = document.getElementById(IeeeVisStream.CONTENT_WRAPPER_ID);
        contentWrap.style.width = `${gatherWidth}px`;

        this.currentPanelTab = state === "QA" ? "slido" : "discord";
        this.updatePanelTabs();

        const slidoFrame = document.getElementById('slido-frame');
        if(slidoFrame) {
            slidoFrame.setAttribute('width', `${this.width * this.CHAT_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX}`);
            slidoFrame.setAttribute('height', `${this.height - IeeeVisStream.HEADERS_HEIGHT}`);
        }

        const discordFrame = document.getElementById('discord-iframe');
        if(discordFrame) {
            discordFrame.setAttribute('width', `${this.width * this.CHAT_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX}`);
            discordFrame.setAttribute('height', `${this.height - IeeeVisStream.HEADERS_HEIGHT}`);
        }
    }
}

const stream = new IeeeVisStream();
export declare var onYouTubeIframeAPIReady;

onYouTubeIframeAPIReady = () => {
    stream.onYouTubeIframeAPIReady();
}