export interface Session {
    name: string;
    currentStatus: SessionStatus;
    discord: string;
    slido: string;
    videos: {
        [index: string]: Video;
    };
}

export interface SessionStatus {
    state: SessionState;
    videoIndex: number;
    videoStartTimestamp: number;
}

export interface Video {
    title: string;
    type: "prerecorded"|"live";
    youtubeId: string;
}

export type SessionState = "WATCHING" | "QA" | "SOCIALIZING";
