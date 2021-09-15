export interface Session {
    name: string;
    currentStatus: SessionStatus;
    discord: string;
    rocketchat: string;
    slido: string;
    room: string;
    stages: {
        [index: string]: SessionStage;
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

export interface SessionStage {
    title: string;
    live?: boolean;
    youtubeId?: string;
    imageUrl?: string;
    state: SessionState;
}

export type SessionState = "WATCHING" | "QA" | "SOCIALIZING" | "PREVIEW";
