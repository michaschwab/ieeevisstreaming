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
