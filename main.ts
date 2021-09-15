import {Room, Session, SessionState, SessionStage} from "./session";
import {IeeeVisDb} from "./ieeevisdb";
import {IeeeVisVideoPlayer} from "./videoplayer";

type PANEL_TAB = "slido" | "discord";

class IeeeVisStream {
    static PLAYER_ELEMENT_ID = 'ytplayer';
    static CONTENT_WRAPPER_ID = 'content';
    static GATHERTOWN_WRAPPER_ID = 'gathertown';

    room?: Room;
    currentSession?: Session;
    player: IeeeVisVideoPlayer;
    db: IeeeVisDb;

    width = window.innerWidth;
    height = window.innerHeight;

    CHAT_WIDTH_PERCENT = 40;
    CHAT_PADDING_LEFT_PX = 20;
    static HEADERS_HEIGHT = 40;

    currentPanelTab: PANEL_TAB = "discord";

    constructor(private ROOM_ID: string) {
        this.db = new IeeeVisDb();
        this.player = new IeeeVisVideoPlayer(IeeeVisStream.PLAYER_ELEMENT_ID,
            this.getCurrentStage.bind(this),
            this.getCurrentVideoId.bind(this),
            () => this.currentSession?.currentStatus);
        this.db.loadRoom(ROOM_ID, room => this.onRoomUpdated(room));

        this.loadGathertown();
        this.initPanelTabs();

        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
    }

    onYouTubeIframeAPIReady() {
        this.player.onYouTubeIframeAPIReady();
    }

    loadChat() {
        document.getElementById('discord-wrap')!.innerHTML = `
            <iframe
                id="discord-iframe"
                src="https://ieeevis-e.widgetbot.co/channels/884159773287805038/${this.currentSession!.discord}"
            ></iframe>`;
    }

    loadSlido() {
        const frame = document.getElementById('slido-frame')!;
        frame.setAttribute('src', `https://app.sli.do/event/${this.currentSession!.slido}`);
    }

    loadGathertown() {
        const html = `<iframe title="gather town"
                              allow="camera;microphone"
                              id="gathertown-iframe"
                              src="https://gather.town/app/aDeS7vVGW5A2wuF5/vis21-tech2"></iframe>`;

        const gatherWrap = document.getElementById(IeeeVisStream.GATHERTOWN_WRAPPER_ID)!;
        gatherWrap.innerHTML = html;
    }

    onRoomUpdated(room: Room) {
        this.room = room;

        this.db.loadSession(room.currentSession, session => this.onSessionUpdated(room.currentSession, session));
    }

    onSessionUpdated(id: string, session: Session) {
        if(this.room?.currentSession != id) {
            // Do not listen to last session's update events.
            return;
        }
        const lastSession: Session | undefined = this.currentSession ? {...this.currentSession} : undefined;
        const lastYtId = this.getCurrentVideoId();
        this.currentSession = session;

        document.getElementById('room-title')!.innerText = this.room!.name;
        document.getElementById('session-title')!.innerText = this.currentSession.name;
        document.getElementById('video-name')!.innerText = this.getCurrentStage()?.title || '';

        if(this.getCurrentVideoId() != lastYtId) {
            this.player.updateVideo();
        }

        if(this.currentSession.discord != lastSession?.discord) {
            this.loadChat();
        }
        if(this.currentSession.slido != lastSession?.slido) {
            this.loadSlido();
        }
        this.resize();
    }

    getCurrentStage(): SessionStage | undefined {
        return this.currentSession?.stages[this.currentSession?.currentStatus?.videoIndex];
    }

    getCurrentVideoId() {
        return this.getCurrentStage()?.youtubeId;
    }

    initPanelTabs() {
        const getToggle = (tabName: PANEL_TAB) => () => {
            console.log(tabName);
            this.currentPanelTab = tabName;
            this.updatePanelTabs();
        };

        document.getElementById('discord-tab-link')!.onclick = getToggle('discord');
        document.getElementById('slido-tab-link')!.onclick = getToggle('slido');
    }

    updatePanelTabs() {
        document.getElementById('discord-tab-link')!.className = '';
        document.getElementById('slido-tab-link')!.className = '';
        document.getElementById(`${this.currentPanelTab}-tab-link`)!.className = 'active';

        document.getElementById('discord-wrap')!.className = '';
        document.getElementById('slido-wrap')!.className = '';
        document.getElementById(`${this.currentPanelTab}-wrap`)!.className = 'active';
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight - 65; // 40px for title

        const state = this.getCurrentStage()?.state;
        const gathertownHeightPercent = state === "SOCIALIZING" ? 65 : 35;

        const playerWidth = this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100;
        const playerHeight = (this.height - IeeeVisStream.HEADERS_HEIGHT * 2) * (100 - gathertownHeightPercent) / 100;
        this.player.setSize(playerWidth, playerHeight);

        const gatherFrame = document.getElementById('gathertown-iframe')!;
        const gatherWidth = this.width * (100 - this.CHAT_WIDTH_PERCENT) / 100;
        const gatherHeight=(this.height - IeeeVisStream.HEADERS_HEIGHT * 2) * gathertownHeightPercent / 100;
        gatherFrame.setAttribute('width', `${gatherWidth}`);
        gatherFrame.setAttribute('height', `${gatherHeight}`);

        const contentWrap = document.getElementById(IeeeVisStream.CONTENT_WRAPPER_ID)!;
        contentWrap.style.width = `${gatherWidth}px`;

        this.currentPanelTab = state === "QA" ? "slido" : "discord";
        this.updatePanelTabs();
        const panelWidth = this.width * this.CHAT_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX;
        document.getElementById('sidepanel')!.style.width = `${panelWidth}px`;

        const slidoFrame = document.getElementById('slido-frame');
        if(slidoFrame) {
            slidoFrame.setAttribute('width', `${panelWidth}`);
            slidoFrame.setAttribute('height', `${this.height - IeeeVisStream.HEADERS_HEIGHT}`);
        }

        const discordFrame = document.getElementById('discord-iframe');
        if(discordFrame) {
            discordFrame.setAttribute('width', `${panelWidth}`);
            discordFrame.setAttribute('height', `${this.height - IeeeVisStream.HEADERS_HEIGHT}`);
        }
    }
}

const roomId = location.search.indexOf('room=') === -1 ? '' :
    location.search.substr(location.search.indexOf('room=') + 'room='.length);
export declare var onYouTubeIframeAPIReady: () => void;

if(roomId) {
    const stream = new IeeeVisStream(roomId);
    document.getElementById('wrapper')!.style.display = 'flex';
    onYouTubeIframeAPIReady = () => {
        stream.onYouTubeIframeAPIReady();
    }
} else {
    document.getElementById('param-error')!.style.display = 'block';
}
