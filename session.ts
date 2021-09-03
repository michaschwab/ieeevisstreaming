export interface Session {
    name: string;
    currentStatus: SessionStatus;
    discord: string;
    rocketchat: string;
    slido: string;
    room: string;
    videos: {
        [index: string]: Video;
    };
}

export interface Room {
    name: string;
    currentSession: string;
}

export interface SessionStatus {
    videoIndex: number;
    videoStartTimestamp: number;
}

export interface Video {
    title: string;
    type: "prerecorded"|"live";
    youtubeId: string;
    state: SessionState;
}

export type SessionState = "WATCHING" | "QA" | "SOCIALIZING";
