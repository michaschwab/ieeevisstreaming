import {Room, Session, SessionState, SessionStage, RoomDayLogs, Log} from "./session";
import {IeeeVisDb} from "./ieeevisdb";
import {IeeeVisVideoPlayer} from "./videoplayer";

class IeeeVisStreamPlayback {
    static PLAYER_ELEMENT_ID = 'ytplayer';
    static CONTENT_WRAPPER_ID = 'content';

    room?: Room;
    currentSession?: Session;
    player: IeeeVisVideoPlayer;
    db: IeeeVisDb;

    width = window.innerWidth;
    height = window.innerHeight; // Placeholder values. Will be replaced in the resize function.
    static HEADERS_HEIGHT = 41;

    PANEL_WIDTH_PERCENT = 30;
    private sessionsData: {[id: string]: Session} = {};
    private roomSlices: RoomSlice[] = [];

    constructor(private ROOM_ID: string, private DAY: string) {
        this.db = new IeeeVisDb();
        this.player = new IeeeVisVideoPlayer(IeeeVisStreamPlayback.PLAYER_ELEMENT_ID,
            this.getCurrentStage.bind(this),
            this.getCurrentVideoId.bind(this),
            () => this.currentSession?.currentStatus);
        this.db.loadRoom(ROOM_ID, room => this.onRoomUpdated(room));
        this.loadPreviewImage();

        this.resize();
        window.addEventListener('resize', this.resize.bind(this));

        this.db.loadAllSessions(sessionsData => {
            this.sessionsData = sessionsData;
            this.db.loadLogs(ROOM_ID, DAY, this.getLogs.bind(this));
        })
    }

    getLogs(logsData: RoomDayLogs) {
        const slices = [];
        const logs = Object.values(logsData) as Log[];

        for(let i = 1; i < logs.length; i++) {
            slices.push(this.createSlice(logs[i-1], logs[i].time - logs[i-1].time));
        }
        slices.push(this.createSlice(logs[logs.length-1], -1));

        this.roomSlices = slices;
        this.updateTable();
    }

    updateTable() {
        if(!this.roomSlices.length) {
            return;
        }

        const tableBody = document.getElementById('videos-table-body') as HTMLTableElement;
        tableBody.innerHTML = '';

        //const currentVideoPlayedMs = new Date().getTime() - this.session.currentStatus.videoStartTimestamp;

        for(const slice of this.roomSlices) {
            const stage = slice.stage;
            const active = false;//this.session.currentStatus.videoIndex.toString() === stageKey;
            const isPreview = stage.state === "PREVIEW";
            //const timePlayed = !active ? '-' : new Date(currentVideoPlayedMs).toISOString().substr(11, 8);
            const ytUrl = `https://www.youtube.com/watch?v=${stage.youtubeId}`;
            const imgUrl = stage.imageUrl;
            let duration = '';
            const startText = !slice.log.time ? '' :
                new Date(slice.log.time).toISOString().substr(0, 16).replace('T', ', ');

            if(slice.duration != -1) {
                const durationMs = slice.duration;
                duration = new Date(durationMs).toISOString().substr(11, 8)
            } else {
                duration = '-';
            }

            const tr = document.createElement('tr');
            tr.className = active ? 'active' : '';
            tr.innerHTML = `
                <td>` +
                (isPreview ? `<a href="${imgUrl}" target="_blank">[Image] ${stage.title}</a>`
                    : `<a href="${ytUrl}" target="_blank">${stage.title}</a>`) + `
                </td>
                <td>${startText} UTC</td>
                <td>${duration}</td>`;

            tableBody.append(tr);
        }
    }

    createSlice(log: Log, duration: number): RoomSlice {
        return {
            duration,
            stage: this.getSessionStage(log),
            log
        };
    }

    getSessionStage(log: Log) {
        return this.sessionsData[log.session].stages[log.status.videoIndex];
    }

    onYouTubeIframeAPIReady() {
        this.player.onYouTubeIframeAPIReady();
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
    }

    onSessionUpdated(id: string, session: Session) {

        const lastSession: Session | undefined = this.currentSession ? {...this.currentSession} : undefined;
        const lastYtId = this.getCurrentVideoId();
        this.currentSession = session;

        document.getElementById('session-name')!.innerText = this.getCurrentStage()?.title || '';

        if(this.getCurrentVideoId() != lastYtId) {
            this.player.updateVideo();
        }
        if(this.getCurrentStage()?.imageUrl != this.getCurrentStageOfSession(lastSession)?.imageUrl) {
            this.loadPreviewImage();
        }

        this.resize();
    }

    getCurrentStage(): SessionStage | undefined {
        return this.getCurrentStageOfSession(this.currentSession);
    }

    getCurrentStageOfSession(session: Session | undefined) {
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

        const contentWidth = this.width * (100 - this.PANEL_WIDTH_PERCENT) / 100;
        const mainContentHeight = this.height - IeeeVisStreamPlayback.HEADERS_HEIGHT;

        const contentWrap = document.getElementById(IeeeVisStreamPlayback.CONTENT_WRAPPER_ID)!;
        contentWrap.style.width = `${contentWidth}px`;
        this.player.setSize(contentWidth, mainContentHeight);

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
    }
}

const search = location.search.indexOf('room=') === -1 ? '' :
    location.search.substr(location.search.indexOf('room=') + 'room='.length);
const dayIndex = search.indexOf('day=');
export declare var onYouTubeIframeAPIReady: () => void;

if(search && dayIndex) {
    const roomId = search.substr(0, dayIndex - 1);
    const dayString = search.substr(dayIndex + 'day='.length);

    const stream = new IeeeVisStreamPlayback(roomId, dayString);
    document.getElementById('wrapper')!.style.display = 'flex';
    onYouTubeIframeAPIReady = () => {
        stream.onYouTubeIframeAPIReady();
    }
} else {
    document.getElementById('param-error')!.style.display = 'block';
}

interface RoomSlice {
    duration: number,
    stage: SessionStage,
    log: Log,
}
