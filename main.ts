import {Room, Session, SessionState, SessionStage} from "./session";
import {IeeeVisDb} from "./ieeevisdb";
import {IeeeVisVideoPlayer} from "./videoplayer";

type PANEL_FOCUS = "none" | "qa" | "chat";

class IeeeVisStream {
    static PLAYER_ELEMENT_ID = 'ytplayer';
    static CONTENT_WRAPPER_ID = 'content';
    static GATHERTOWN_WRAPPER_ID = 'gathertown';

    room?: Room;
    currentSession?: Session;
    player: IeeeVisVideoPlayer;
    db: IeeeVisDb;

    width = window.innerWidth;
    height = window.innerHeight; // Placeholder values. Will be replaced in the resize function.

    PANEL_WIDTH_PERCENT = 40;
    CHAT_PADDING_LEFT_PX = 20;
    static HEADERS_HEIGHT = 41;
    HORIZONTAL_PADDING = 30;
    CAPTIONS_HEIGHT_PX = 150;

    currentPanelFocus: PANEL_FOCUS = "none";

    constructor(private ROOM_ID: string) {
        this.db = new IeeeVisDb();
        this.player = new IeeeVisVideoPlayer(IeeeVisStream.PLAYER_ELEMENT_ID,
            this.getCurrentStage.bind(this),
            this.getCurrentVideoId.bind(this),
            () => this.currentSession?.currentStatus);
        this.db.loadRoom(ROOM_ID, room => this.onRoomUpdated(room));

        this.loadPreviewImage();

        this.resize();
        window.addEventListener('resize', this.resize.bind(this));

        this.checkPanelFocus();
    }

    onYouTubeIframeAPIReady() {
        this.player.onYouTubeIframeAPIReady();
    }

    loadChat() {
        document.getElementById('discord-wrap')!.innerHTML = `
            <iframe
                id="discord-iframe"
                src="https://ieeevis-e.widgetbot.co/channels/884159773287805038/${this.room!.discord}"
            ></iframe>`;
    }

    loadSlido() {
        const frame = document.getElementById('slido-frame')!;
        const url = `https://app.sli.do/event/${this.room!.slido}?section=${this.room!.slido_room}`;
        frame.setAttribute('src', url);
    }

    checkPanelFocus() {
        window.setInterval(() => {
            const lastFocus = this.currentPanelFocus;

            if(document.activeElement == document.getElementById('discord-iframe')) {
                this.currentPanelFocus = "chat";
            } else if (document.activeElement == document.getElementById('slido-frame')) {
                this.currentPanelFocus = "qa";
            } else {
                this.currentPanelFocus = "none";
            }

            if(lastFocus != this.currentPanelFocus) {
                this.resize();
            }
        }, 200);
    }

    updateGathertown() {
        const gatherWrap = document.getElementById(IeeeVisStream.GATHERTOWN_WRAPPER_ID)!;

        gatherWrap.innerHTML = this.getCurrentStage()?.state !== "SOCIALIZING" ? "" :
            `<iframe title="gather town"
                              allow="camera;microphone"
                              id="gathertown-iframe"
                              src="https://gather.town/app/uT2p5cFP0oXFZg4E/ieee-vis-2021?spawnToken=nLvBRdVP_nCJOs3p"></iframe>`;
    }

    loadPreviewImage() {
        console.log('loading preview', this.getCurrentStage()?.imageUrl);
        const url = this.getCurrentStage()?.imageUrl;
        const html = !url ? '' : `<img src="${url}"  alt="Preview Image" id="preview-img" />`;
        const previewWrap = document.getElementById('image-outer')!;
        previewWrap.innerHTML = html;
    }

    onRoomUpdated(room: Room) {
        this.room = room;

        this.loadChat();
        this.loadSlido();

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

        document.getElementById('session-name')!.innerText = this.getCurrentStage()?.title || '';

        this.player.updateVideo();
        if(this.getCurrentStage()?.imageUrl != this.getCurrentStageOfSession(lastSession)?.imageUrl) {
            this.loadPreviewImage();
        }
        this.updateGathertown();
        this.updateCaptions();

        this.resize();
    }

    updateCaptions() {
        const captionsWrap = document.getElementById('captions-outer')!;
        if(this.getCurrentStage()?.has_live_captions) {
            captionsWrap.style.display = '';
            const url = this.getCurrentStage()!.live_captions_url;
            captionsWrap.innerHTML =
                `<iframe id="captions-iframe" src="${url}" height="${this.CAPTIONS_HEIGHT_PX}" width="100%"></iframe>`;
        } else {
            captionsWrap.style.display = 'none';
        }
    }

    getCurrentStage(): SessionStage | undefined {
        return this.getCurrentStageOfSession(this.currentSession);
    }

    getCurrentStageOfSession(session: Session | undefined) {
        if(!session || !session?.currentStatus) {
            return;
        }
        return session?.stages[session?.currentStatus?.videoIndex];
    }

    getCurrentVideoId() {
        return this.getCurrentStage()?.youtubeId;
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight - 15;

        const state = this.getCurrentStage()?.state;

        if(!state) {
            return;
        }

        if(state === "SOCIALIZING") {
            // Show gathertown, hide YouTube
            document.getElementById('youtube-outer')!.style.display = 'none';
            document.getElementById('image-outer')!.style.display = 'none';
            document.getElementById('gathertown-outer')!.style.display = '';

        } else if(state === "PREVIEW") {
            document.getElementById('youtube-outer')!.style.display = 'none';
            document.getElementById('image-outer')!.style.display = '';
            document.getElementById('gathertown-outer')!.style.display = 'none';
        } else {
            // Hide gathertown, show YouTube
            document.getElementById('youtube-outer')!.style.display = '';
            document.getElementById('image-outer')!.style.display = 'none';
            document.getElementById('gathertown-outer')!.style.display = 'none';
        }

        const contentWidth = this.width * (100 - this.PANEL_WIDTH_PERCENT) / 100 - this.HORIZONTAL_PADDING;
        const mainContentHeight = this.height - IeeeVisStream.HEADERS_HEIGHT;

        let playerHeight = mainContentHeight;
        if(this.getCurrentStage()?.has_live_captions && this.getCurrentStage()?.live_captions_url) {
            playerHeight -= this.CAPTIONS_HEIGHT_PX;
        }

        const contentWrap = document.getElementById(IeeeVisStream.CONTENT_WRAPPER_ID)!;
        contentWrap.style.width = `${contentWidth}px`;
        this.player.setSize(contentWidth, playerHeight);

        const previewImg = document.getElementById('preview-img');
        if(previewImg) {
            document.getElementById('image-outer')!.style.height = `${mainContentHeight}px`;
            previewImg.style.maxWidth = `${contentWidth}px`;
            previewImg.style.maxHeight = `${mainContentHeight}px`;
        }

        const gatherFrame = document.getElementById('gathertown-iframe');
        if(gatherFrame) {
            gatherFrame.setAttribute('width', `${contentWidth}`);
            gatherFrame.setAttribute('height', `${mainContentHeight}`);
        }

        const qaShown = ["WATCHING", "QA"].indexOf(state) !== -1;
        const numHeaders = qaShown ? 2 : 1;
        const panelWidth = this.width * this.PANEL_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX;
        const panelContentHeight = this.height - IeeeVisStream.HEADERS_HEIGHT * numHeaders;

        const qaWrap = document.getElementById('qa')!;
        qaWrap.style.display = qaShown ? '' : 'none';

        let qaHeightPercent = 0;
        if(qaShown) {
            qaHeightPercent = 40;

            if(state === "QA") {
                qaHeightPercent = 60;
            }
            if(this.currentPanelFocus === "qa") {
                qaHeightPercent = 70;
            } else if(this.currentPanelFocus === "chat") {
                qaHeightPercent = 30;
            }
        }

        document.getElementById('sidepanel')!.style.width = `${panelWidth}px`;

        const slidoFrame = document.getElementById('slido-frame')!;
        const slidoTopOffset = 0; // +0 offset for the top bar. Must match CSS.
        const slidoHeight = qaHeightPercent / 100 * panelContentHeight + slidoTopOffset;

        if(slidoFrame) {
            slidoFrame.setAttribute('width', `${panelWidth}`);
            slidoFrame.style.height = `${slidoHeight}px`;
            document.getElementById('slido-wrap')!.style.height = `${slidoHeight - slidoTopOffset}px`;
        }

        const discordFrame = document.getElementById('discord-iframe');
        if(discordFrame) {
            discordFrame.setAttribute('width', `${panelWidth}`);
            discordFrame.style.height = `${(100 - qaHeightPercent) / 100 * panelContentHeight}px`;
            document.getElementById('discord-wrap')!.style.height = `${(100 - qaHeightPercent) / 100 * panelContentHeight}px`;
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
