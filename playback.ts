import {Room, Session, SessionState, SessionStage, RoomDayLogs, Log} from "./session";
import {IeeeVisDb} from "./ieeevisdb";
import {IeeeVisVideoPlayer} from "./videoplayer";
import {IeeeVisReplayVideoPlayer} from "./replayvideoplayer";

class IeeeVisStreamPlayback {
    static PLAYER_ELEMENT_ID = 'ytplayer';
    static CONTENT_WRAPPER_ID = 'content';

    room?: Room;
    currentSlice?: RoomSlice;
    player: IeeeVisReplayVideoPlayer;
    db: IeeeVisDb;

    width = window.innerWidth;
    height = window.innerHeight; // Placeholder values. Will be replaced in the resize function.
    static HEADERS_HEIGHT = 41;

    PANEL_WIDTH_PERCENT = 30;
    private sessionsData: {[id: string]: Session} = {};
    private roomSlices: RoomSlice[] = [];

    constructor(private ROOM_ID: string, private DAY: string) {
        this.db = new IeeeVisDb();
        this.player = new IeeeVisReplayVideoPlayer(IeeeVisStreamPlayback.PLAYER_ELEMENT_ID,
            this.getCurrentVideoId.bind(this));
        this.db.loadRoom(ROOM_ID, room => this.onRoomUpdated(room));

        this.resize();
        window.addEventListener('resize', this.resize.bind(this));

        this.db.loadAllSessions(sessionsData => {
            this.sessionsData = sessionsData;
            this.db.loadLogs(ROOM_ID, DAY, this.getLogs.bind(this));
        })
    }

    getLogs(logsData: RoomDayLogs) {
        const slices: RoomSlice[] = [];
        const logs = Object.values(logsData) as Log[];

        for(let i = 1; i < logs.length; i++) {
            this.addSliceIfYouTube(slices, logs[i-1], logs[i].time - logs[i-1].time);
        }
        this.addSliceIfYouTube(slices, logs[logs.length-1], -1)

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
                <td>${stage.title}</a></td>
                <td>${startText} UTC</td>
                <td>${duration}</td>
                <td>${Math.round(slice.startTimeMs / 1000)}</td>
                <td>${Math.round(slice.endTimeMs / 1000)}</td>`;
            tr.addEventListener('click', () => this.clickStage(slice))

            tableBody.append(tr);
        }
    }

    clickStage(slice: RoomSlice) {
        console.log('hiii2', slice);
        this.currentSlice = slice;
        this.player.updateVideo();
    }

    addSliceIfYouTube(slices: RoomSlice[], log: Log, duration: number) {
        const slice = this.createSliceIfYouTube(log, duration);
        if(slice) {
            slices.push(slice);
        }
    }

    createSliceIfYouTube(log: Log, duration: number): RoomSlice | undefined {
        const stage = this.getSessionStage(log);
        if(!stage.youtubeId) {
            return;
        }
        const startTimeMs = stage.youtubeId && stage.live ?
            log.status.videoStartTimestamp - log.status.liveStreamStartTimestamp  : 0;
        const endTimeMs = startTimeMs + duration;
        return {
            duration,
            stage,
            log,
            startTimeMs,
            endTimeMs,
        };
    }

    getSessionStage(log: Log) {
        return this.sessionsData[log.session].stages[log.status.videoIndex];
    }

    onYouTubeIframeAPIReady() {
        this.player.onYouTubeIframeAPIReady();
    }

    onRoomUpdated(room: Room) {
        this.room = room;
    }

    onSessionUpdated(id: string, session: Session) {
        /*const lastSession: Session | undefined = this.currentSession ? {...this.currentSession} : undefined;
        const lastYtId = this.getCurrentVideoId();
        this.currentSession = session;

        document.getElementById('session-name')!.innerText = this.getCurrentStage()?.title || '';

        if(this.getCurrentVideoId() != lastYtId) {
            this.player.updateVideo();
        }
        if(this.getCurrentStage()?.imageUrl != this.getCurrentStageOfSession(lastSession)?.imageUrl) {
            this.loadPreviewImage();
        }

        this.resize();*/
    }

    /*getCurrentStage(): SessionStage | undefined {
        return this.getCurrentStageOfSession(this.currentSession);
    }

    getCurrentStageOfSession(session: Session | undefined) {
        return session?.stages[session?.currentStatus?.videoIndex];
    }*/

    getCurrentVideoId() {
        return this.currentSlice?.stage.youtubeId;
        //return this.getCurrentStage()?.youtubeId;
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight - 15;

        const state = "WATCHING";//this.getCurrentStage()?.state;

        if(!state) {
            return;
        }

        document.getElementById('youtube-outer')!.style.display = '';
        document.getElementById('image-outer')!.style.display = 'none';
        document.getElementById('gathertown-outer')!.style.display = 'none';

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
export declare var playback: IeeeVisStreamPlayback;

if(search && dayIndex) {
    const roomId = search.substr(0, dayIndex - 1);
    const dayString = search.substr(dayIndex + 'day='.length);

    playback = new IeeeVisStreamPlayback(roomId, dayString);
    document.getElementById('wrapper')!.style.display = 'flex';
    onYouTubeIframeAPIReady = () => {
        playback.onYouTubeIframeAPIReady();
    }
} else {
    document.getElementById('param-error')!.style.display = 'block';
}

interface RoomSlice {
    duration: number,
    stage: SessionStage,
    log: Log,
    startTimeMs: number,
    endTimeMs: number
}
