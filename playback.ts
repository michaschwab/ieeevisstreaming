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
    CHAT_PADDING_LEFT_PX = 30;

    PANEL_WIDTH_PERCENT = 30;
    private sessionsData: {[id: string]: Session} = {};
    private roomSlices: RoomSlice[] = [];

    hasStartedPlaying = false;

    constructor(private ROOM_ID: string, private DAY: string, private SESSION: string) {
        this.db = new IeeeVisDb();
        this.player = new IeeeVisReplayVideoPlayer(IeeeVisStreamPlayback.PLAYER_ELEMENT_ID,
            this.getCurrentVideoId.bind(this),
            this.getCurrentStartEndTime.bind(this),
            this.onPlayerEnded.bind(this));
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
        let logs = Object.values(logsData) as Log[];
        logs.sort((a, b) => a.time - b.time);
        logs = logs.filter(l => !this.SESSION || l.session === this.SESSION);

        for(let i = 1; i < logs.length; i++) {
            this.addSliceIfYouTube(slices, logs[i-1], logs[i].time - logs[i-1].time);
        }
        this.addSliceIfYouTube(slices, logs[logs.length-1], -1)

        this.roomSlices = slices;
        if(this.roomSlices.length && !this.hasStartedPlaying) {
            this.hasStartedPlaying = true;
            this.clickStage(this.roomSlices[0]);
        }

        console.log(this.roomSlices);
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
            const active = this.currentSlice === slice;

            let duration = '';

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
                <td>${duration}</td>`;
            tr.addEventListener('click', () => this.clickStage(slice))

            tableBody.append(tr);
        }
    }

    clickStage(slice: RoomSlice) {
        console.log('loading slice', slice);
        this.currentSlice = slice;
        this.player.updateVideo();
        this.updateTable();
    }

    onPlayerEnded() {
        if(!this.currentSlice) {
            return;
        }
        const index = this.roomSlices.indexOf(this.currentSlice);
        if(index === -1) {
            return;
        }
        if (index + 1 >= this.roomSlices.length) {
            return;
        }
        // Auto-advance to next stage.
        this.clickStage(this.roomSlices[index + 1]);
    }

    getCurrentStartEndTime(): [number, number] {
        const startS = Math.round((this.currentSlice?.startTimeMs || 0) / 1000);
        const endS = Math.round((this.currentSlice?.endTimeMs || 0) / 1000);
        return [startS, endS];
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

        document.getElementById('youtube-outer')!.style.display = '';
        document.getElementById('image-outer')!.style.display = 'none';
        document.getElementById('gathertown-outer')!.style.display = 'none';

        const contentWidth = this.width * (100 - this.PANEL_WIDTH_PERCENT) / 100;
        const mainContentHeight = this.height - IeeeVisStreamPlayback.HEADERS_HEIGHT;

        const contentWrap = document.getElementById(IeeeVisStreamPlayback.CONTENT_WRAPPER_ID)!;
        contentWrap.style.width = `${contentWidth}px`;
        this.player.setSize(contentWidth, mainContentHeight);

        const panelWidth = this.width * this.PANEL_WIDTH_PERCENT / 100 - this.CHAT_PADDING_LEFT_PX;
        document.getElementById('sidepanel')!.style.width = `${panelWidth}px`;
    }
}

const search = location.search.indexOf('room=') === -1 ? '' :
    location.search.substr(location.search.indexOf('room=') + 'room='.length);
const dayIndex = search.indexOf('day=');
export declare var onYouTubeIframeAPIReady: () => void;
export declare var playback: IeeeVisStreamPlayback;

if(search && dayIndex) {
    const roomId = search.substr(0, dayIndex - 1);
    let dayString = search.substr(dayIndex + 'day='.length);
    const sessionIndex = dayString.indexOf('session=');
    let sessionString = '';
    if(sessionIndex !== -1) {
        sessionString = dayString.substr(sessionIndex + 'session='.length);
        dayString = dayString.substr(0, sessionIndex - 1);
    }
    console.log(roomId, dayString, sessionString);

    playback = new IeeeVisStreamPlayback(roomId, dayString, sessionString);
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
