import {Track} from "./track";
import {IeeeVisDb} from "./ieeevisdb";

declare var YT;

class IeeeVisStreamAdmin {
    data: Track;
    db: IeeeVisDb;

    constructor() {
        this.db = new IeeeVisDb(this.onData.bind(this));
        this.db.loadData();
    }

    onData(track: Track) {
        this.data = track;

        document.getElementById('track-title').innerText = this.data.name;

        this.updateTable();

        setInterval(this.updateTable.bind(this), 1000);
    }

    updateTable() {
        const tableBody = document.getElementById('videos-table-body') as HTMLTableElement;
        tableBody.innerHTML = '';

        console.log(this.data.videos);
        const currentVideoPlayedMs = new Date().getTime() - this.data.currentStatus.videoStartTimestamp;

        for(const videoKey in this.data.videos) {
            const video = this.data.videos[videoKey];
            const active = this.data.currentStatus.videoIndex.toString() === videoKey;

            const timePlayed = !active ? '-' : new Date(currentVideoPlayedMs).toISOString().substr(11, 8);

            const tr = document.createElement('tr');
            tr.className = active ? 'active' : '';
            tr.innerHTML = `<td>${video.title}</td><td>${video.type}</td><td>${timePlayed}</td>`;

            tableBody.append(tr);
        }
    }
}

const streamAdmin = new IeeeVisStreamAdmin();