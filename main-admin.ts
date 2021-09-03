import {Session} from "./session";
import {IeeeVisDb} from "./ieeevisdb";
import {IeeeVisAuth} from "./auth";

class IeeeVisStreamAdmin {
    session?: Session;
    db: IeeeVisDb;

    constructor(private SESSION_ID: string) {
        this.db = new IeeeVisDb();
        this.db.loadSession(SESSION_ID, session => this.onSessionUpdated(session));

        new IeeeVisAuth();

        document.getElementById('previous-video-button')!.onclick = this.previousVideo.bind(this);
        document.getElementById('next-video-button')!.onclick = this.nextVideo.bind(this);

        setInterval(this.updateTable.bind(this), 1000);
    }

    onSessionUpdated(session: Session) {
        this.session = session;

        document.getElementById('track-title')!.innerText = this.session.name;
    }

    updateTable() {
        if(!this.session) {
            return;
        }

        const tableBody = document.getElementById('videos-table-body') as HTMLTableElement;
        tableBody.innerHTML = '';

        const currentVideoPlayedMs = new Date().getTime() - this.session.currentStatus.videoStartTimestamp;

        for(const videoKey in this.session.videos) {
            const video = this.session.videos[videoKey];
            const active = this.session.currentStatus.videoIndex.toString() === videoKey;
            const timePlayed = !active ? '-' : new Date(currentVideoPlayedMs).toISOString().substr(11, 8);
            const ytUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;

            const tr = document.createElement('tr');
            tr.className = active ? 'active' : '';
            tr.innerHTML = `
                <td><a href=${ytUrl}" target="_blank">${video.title}</a></td>
                <td>${video.type}</td>
                <td>${timePlayed}</td>
                <td>${video.state}</td>`;

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

console.log('session', sessionId);

if(sessionId) {
    const streamAdmin = new IeeeVisStreamAdmin(sessionId);
    document.getElementById('wrapper')!.style.display = 'block';
} else {
    document.getElementById('param-error')!.style.display = 'block';
}