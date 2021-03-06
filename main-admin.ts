import {AdminsData, Room, Session, SessionStatus, User} from "./session";
import {IeeeVisDb} from "./ieeevisdb";
import {IeeeVisAuth} from "./auth";

class IeeeVisStreamAdmin {
    session?: Session;
    db: IeeeVisDb;
    admins?: AdminsData;
    user?: User;
    room?: Room;

    constructor(private SESSION_ID: string) {
        this.db = new IeeeVisDb();
        this.db.loadSession(SESSION_ID, session => this.onSessionUpdated(session));

        new IeeeVisAuth(this.onUserUpdated.bind(this));

        document.getElementById('timezone')!.innerText = Intl.DateTimeFormat().resolvedOptions().timeZone;
        document.getElementById('previous-video-button')!.onclick = this.previousVideo.bind(this);
        document.getElementById('next-video-button')!.onclick = this.nextVideo.bind(this);
        document.getElementById('session-to-room-button')!.onclick = this.sessionToRoom.bind(this);

        setInterval(this.updateTable.bind(this), 1000);

        this.db.loadAdmins(admins => {
            this.admins = admins;
            this.onUserUpdated(this.user);
        });
    }

    onSessionUpdated(session: Session) {
        this.session = session;

        document.getElementById('track-title')!.innerText = this.session.name;
        document.getElementById('room-id')!.innerText = this.session.room;
        document.getElementById('session-time')!.innerText =
            `${formatDate(this.session.time_start)} until ${formatDate(this.session.time_end)}`;
        document.getElementById('session-chair')!.innerText = this.session.chairs || '';

        this.db.loadRoom(session.room, room => this.onRoomUpdated(session.room, room));
    }

    onRoomUpdated(roomId: string, room: Room) {
        if(roomId != this.session?.room) {
            // Do not listen to update events of a different room.
            return;
        }
        this.room = room;
        Array.from(document.getElementsByClassName('room-name')).map(el => (el as HTMLElement).innerText = room.name);
        document.getElementById('room-link')!.innerHTML =
            `<a href="https://virtual.ieeevis.org/year/2021/room_${roomId}.html" target="_blank">${room.name}</a>`;
        //document.getElementById('room-name')!.innerText = room.name;
        document.getElementById('room-currentsession')!.innerText = room.currentSession;

        const isLive = this.isLive();
        document.getElementById('live-session-alert')!.style.display = isLive ? 'block' : 'none';
        document.getElementById('live-room-name')!.innerText = room.name;

        document.getElementById('session-to-room-button')!.style.display = isLive ? 'none' : '';
    }

    onUserUpdated(user?: User) {
        this.user = user;
        document.getElementById('uid')!.innerText = this.user?.uid || '-';

        if(this.user && this.admins && this.admins.hasOwnProperty(this.user.uid)) {
            document.getElementById('access-alert')!.style.display = 'none';
            document.getElementById('admin-content')!.style.display = 'block';
        } else {
            document.getElementById('access-alert')!.style.display = '';
            document.getElementById('admin-content')!.style.display = 'none';
        }
        this.updateTable();
    }

    updateTable() {
        if(!this.session || !this.user || !this.admins || !this.admins.hasOwnProperty(this.user.uid)) {
            return;
        }

        document.getElementById('zoom-url')!.innerHTML =
            `<a href="${this.session.zoom_url}">${this.session.zoom_url}</a>`;


        document.getElementById('session-notes')!.innerText = this.session.notes;

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
            const startText = !stage.time_start ? '' : formatDate(stage.time_start);

            if(stage.time_start && stage.time_end) {
                const start = new Date(stage.time_start);
                const end = new Date(stage.time_end);
                const durationMs = end.getTime() - start.getTime();
                duration = new Date(durationMs).toISOString().substr(11, 8)
            } else {
                duration = '-';
            }
            if(stage.live) {
                duration += ' (live)';
            }

            const tr = document.createElement('tr');
            tr.className = active ? 'active' : '';

            const slidoLabel = stage.slido_label;


            tr.innerHTML = `
                <td>` +
                (isPreview ? `<a href="${imgUrl}" target="_blank">[Image] ${stage.title}</a>`
                    : `<a href="${ytUrl}" target="_blank">${stage.title}</a>`) + `
                </td>
                <td>${startText}</td>
                <td>${duration}</td>
                <td>${timePlayed}</td>
                <td>${stage.state}</td>
                <td>${stage.contributors || ''}</td>
                <td>${stage.notes || ''}</td>
                <td class="slido-col"></td>`;

            if(slidoLabel) {
                const slidoCopyLink = document.createElement('a');
                slidoCopyLink.addEventListener('click', () => copyTextToClipboard(slidoLabel));
                slidoCopyLink.innerText = slidoLabel + " ????";
                slidoCopyLink.className = 'slido-copy-link';
                slidoCopyLink.title = `Click to copy ${slidoLabel} to your clipboard`;
                tr.getElementsByClassName('slido-col')[0].appendChild(slidoCopyLink);
            }

            tableBody.append(tr);
        }
    }

    previousVideo() {
        this.updateVideoIndex(this.session!.currentStatus.videoIndex - 1);
    }

    nextVideo() {
        const currentStage = this.session?.stages[this.session!.currentStatus.videoIndex];
        if(currentStage?.live) {
            const nextStageButton = document.getElementById('next-video-button')! as HTMLButtonElement;
            nextStageButton.disabled = true;
            nextStageButton.innerText = 'Switching to next stage in 3...';
            setTimeout(() => nextStageButton.innerText = 'Switching to next stage in 2...', 1500);
            setTimeout(() => nextStageButton.innerText = 'Switching to next stage in 1...', 2500);
            setTimeout(() => {
                nextStageButton.innerText = 'Next Stage';
                nextStageButton.disabled = false;
                this.updateVideoIndex(this.session!.currentStatus.videoIndex + 1);
            }, 3500);
        } else {
            this.updateVideoIndex(this.session!.currentStatus.videoIndex + 1);
        }
    }

    sessionToRoom() {
        this.db.setRoom('currentSession', this.SESSION_ID);

        this.db.log({
            room: this.session!.room,
            session: this.SESSION_ID,
            status: this.session!.currentStatus,
            admin: this.user?.uid!,
            time: new Date().getTime(),
            youtubeId: this.session?.stages[this.session?.currentStatus.videoIndex].youtubeId || '',
            title: this.session?.stages[this.session?.currentStatus.videoIndex].title || '',
        });
    }

    private async updateVideoIndex(index: number) {
        if(!this.session?.stages[index]) {
            return;
        }
        const liveStreamStartTimestamp = await this.maybeLoadLiveVideoStart(index);

        const status: SessionStatus = {
            videoStartTimestamp: new Date().getTime(),
            videoIndex: index,
            liveStreamStartTimestamp: liveStreamStartTimestamp || 0
        };
        this.db.set('currentStatus', status);

        if(this.isLive()) {
            this.db.log({
                room: this.session!.room,
                session: this.SESSION_ID,
                status,
                admin: this.user?.uid!,
                time: new Date().getTime(),
                youtubeId: this.session?.stages[status.videoIndex].youtubeId || '',
                title: this.session?.stages[status.videoIndex].title || '',
            });
        }

        this.session!.currentStatus.videoStartTimestamp = new Date().getTime();
        this.session!.currentStatus.videoIndex = index;
        this.updateTable();
    }

    private maybeLoadLiveVideoStart(index: number): Promise<number> {
        return new Promise((resolve, reject) => {
            const stage = this.session!.stages[index];

            if(stage?.live) {
                // Fetch live video start.
                const apiKey = 'AIzaSyDxGUDBsYHoOLJf5O2kf8gKgvJjQRcVykE';
                const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${stage.youtubeId}&key=${apiKey}`;
                const request = new Request(url, { method: "GET" });
                fetch(request)
                    .then(response => {
                        if (response.status === 200) {
                            return response.json();
                        } else {
                            throw new Error('Something went wrong on api server!');
                        }
                    })
                    .then((blob: LiveStreamingDetails) => {
                        //console.log('got it', blob, blob.items[0].liveStreamingDetails.actualStartTime)
                        resolve((new Date(blob.items[0].liveStreamingDetails.actualStartTime)).getTime());
                    })
                    .catch(error => console.error(error));
            } else {
                resolve(0);
            }
        });
    }

    private isLive() {
        return this.room?.currentSession == this.SESSION_ID;
    }
}

function formatDate(time: string) {
    //return new Date(time).toISOString().substr(0, 16).replace('T', ', ')
    return new Date(time).toLocaleString();
}

const sessionId = location.search.indexOf('session=') === -1 ? '' :
    location.search.substr(location.search.indexOf('session=') + 'session='.length);

if(sessionId) {
    const streamAdmin = new IeeeVisStreamAdmin(sessionId);
    document.getElementById('wrapper')!.style.display = 'block';
} else {
    document.getElementById('param-error')!.style.display = 'block';
}

interface LiveStreamingDetails {
    "kind": string;
    "etag": string;
    "items": {
        "kind": string,
        "etag": string,
        "id": string,
        "liveStreamingDetails": {
            "actualStartTime": string,
            "scheduledStartTime": string,
            "activeLiveChatId": string
        }
    }[],
    "pageInfo": {
        "totalResults": number,
        "resultsPerPage": number
    }
}

function fallbackCopyTextToClipboard(text: string) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}
function copyTextToClipboard(text: string) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function() {
        console.log('Successfully copied ', text);
    }, function(err) {
        console.error('Could not copy text ', err);
    });
}