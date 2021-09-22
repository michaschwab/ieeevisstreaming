import {Room, Session} from "./session";
import {IeeeVisDb} from "./ieeevisdb";
import {IeeeVisAuth} from "./auth";

class IeeeVisStreamAdmin {
    session?: Session;
    db: IeeeVisDb;

    constructor(private SESSION_ID: string) {
        this.db = new IeeeVisDb();
        this.db.loadSession(SESSION_ID, session => this.onSessionUpdated(session));

        new IeeeVisAuth(location);

        document.getElementById('previous-video-button')!.onclick = this.previousVideo.bind(this);
        document.getElementById('next-video-button')!.onclick = this.nextVideo.bind(this);
        document.getElementById('session-to-room-button')!.onclick = this.sessionToRoom.bind(this);

        setInterval(this.updateTable.bind(this), 1000);
    }

    onSessionUpdated(session: Session) {
        this.session = session;

        document.getElementById('track-title')!.innerText = this.session.name;
        document.getElementById('room-id')!.innerText = this.session.room;

        this.db.loadRoom(session.room, room => this.onRoomUpdated(session.room, room));
    }

    onRoomUpdated(roomId: string, room: Room) {
        if(roomId != this.session?.room) {
            // Do not listen to update events of a different room.
            return;
        }
        document.getElementById('room-name')!.innerText = room.name;
        document.getElementById('room-currentsession')!.innerText = room.currentSession;
    }

    updateTable() {
        if(!this.session) {
            return;
        }

        const tableBody = document.getElementById('videos-table-body') as HTMLTableElement;
        tableBody.innerHTML = '';

        const currentVideoPlayedMs = new Date().getTime() - this.session.currentStatus.videoStartTimestamp;

        for(const stageKey in this.session.stages) {
            const stage = this.session.stages[stageKey];
            const active = this.session.currentStatus.videoIndex.toString() === stageKey;
            const isPreview = stage.state === "PREVIEW";
            const timePlayed = !active ? '-' : new Date(currentVideoPlayedMs).toISOString().substr(11, 8);
            const ytUrl = `https://www.youtube.com/watch?v=${stage.youtubeId}`;
            const imgUrl = stage.imageUrl;
            let duration = '';
            const startText = !stage.time_start ? '' :
                new Date(stage.time_start).toISOString().substr(0, 16).replace('T', ', ');

            if(stage.time_start && stage.time_end) {
                const start = new Date(stage.time_start);
                const end = new Date(stage.time_end);
                const durationMs = end.getTime() - start.getTime();
                duration = new Date(durationMs).toISOString().substr(11, 8)
            } else if(stage.live) {
                duration = '(live)';
            } else {
                duration = '-';
            }

            const tr = document.createElement('tr');
            tr.className = active ? 'active' : '';
            tr.innerHTML = `
                <td>` +
                (isPreview ? `<a href="${imgUrl}" target="_blank">[Image] ${stage.title}</a>`
                    : `<a href=${ytUrl}" target="_blank">${stage.title}</a>`) + `
                </td>
                <td>${startText}</td>
                <td>${duration}</td>
                <td>${timePlayed}</td>
                <td>${stage.state}</td>`;

            tableBody.append(tr);
        }
    }

    previousVideo() {
        this.updateVideoIndex(this.session!.currentStatus.videoIndex - 1);
    }

    nextVideo() {
        //TODO: don't allow going past the number of vids.
        this.updateVideoIndex(this.session!.currentStatus.videoIndex + 1);
    }

    sessionToRoom() {
        this.db.setRoom('currentSession', this.SESSION_ID);
    }

    private updateVideoIndex(index: number) {
        this.db.set('currentStatus', {
            videoStartTimestamp: new Date().getTime(),
            videoIndex: index
        });
        /*this.db.set('currentStatus/videoStartTimestamp', new Date().getTime());
        this.db.set('currentStatus/videoIndex', index);*/
        this.session!.currentStatus.videoStartTimestamp = new Date().getTime();
        this.session!.currentStatus.videoIndex = index;
        this.updateTable();
    }
}

const sessionId = location.search.indexOf('session=') === -1 ? '' :
    location.search.substr(location.search.indexOf('session=') + 'session='.length);

if(sessionId) {
    const streamAdmin = new IeeeVisStreamAdmin(sessionId);
    document.getElementById('wrapper')!.style.display = 'block';
} else {
    document.getElementById('param-error')!.style.display = 'block';
}
