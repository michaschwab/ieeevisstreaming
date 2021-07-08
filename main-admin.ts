import {Track} from "./track";
import {IeeeVisDb} from "./ieeevisdb";
import {IeeeVisAuth} from "./auth";

declare var YT;

class IeeeVisStreamAdmin {
    data: Track;
    db: IeeeVisDb;

    constructor() {
        this.db = new IeeeVisDb(this.onData.bind(this));
        this.db.loadData();

        new IeeeVisAuth();

        document.getElementById('previous-video-button').onclick = this.previousVideo.bind(this);
        document.getElementById('next-video-button').onclick = this.nextVideo.bind(this);

        setInterval(this.updateTable.bind(this), 1000);
    }

    onData(track: Track) {
        this.data = track;

        document.getElementById('track-title').innerText = this.data.name;
    }

    updateTable() {
        if(!this.data) {
            return;
        }

        const tableBody = document.getElementById('videos-table-body') as HTMLTableElement;
        tableBody.innerHTML = '';

        const currentVideoPlayedMs = new Date().getTime() - this.data.currentStatus.videoStartTimestamp;

        for(const videoKey in this.data.videos) {
            const video = this.data.videos[videoKey];
            const active = this.data.currentStatus.videoIndex.toString() === videoKey;
            const timePlayed = !active ? '-' : new Date(currentVideoPlayedMs).toISOString().substr(11, 8);
            const ytUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;

            const tr = document.createElement('tr');
            tr.className = active ? 'active' : '';
            tr.innerHTML = `
                <td><a href=${ytUrl}" target="_blank">${video.title}</a></td>
                <td>${video.type}</td>
                <td>${timePlayed}</td>`;

            tableBody.append(tr);
        }
    }

    previousVideo() {
        this.updateVideoIndex(this.data.currentStatus.videoIndex - 1);
    }

    nextVideo() {
        this.updateVideoIndex(this.data.currentStatus.videoIndex + 1);
    }

    private updateVideoIndex(index: number) {
        this.db.set('currentStatus', {
            videoStartTimestamp: new Date().getTime(),
            videoIndex: index
        });
        /*this.db.set('currentStatus/videoStartTimestamp', new Date().getTime());
        this.db.set('currentStatus/videoIndex', index);*/
        this.data.currentStatus.videoStartTimestamp = new Date().getTime();
        this.data.currentStatus.videoIndex = index;
        this.updateTable();
    }
}

const streamAdmin = new IeeeVisStreamAdmin();