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
    }
}

const streamAdmin = new IeeeVisStreamAdmin();