export interface Session {
    name: string;
    currentStatus: SessionStatus;
    room: string;
    time_start: string;
    time_end: string;
    stages: {
        [index: string]: SessionStage;
    };
}

export interface Room {
    name: string;
    currentSession: string;
    discord: string;
    slido: string;
    slido_room: string;
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
    time_start?: string;
    time_end?: string;
}

export type SessionState = "WATCHING" | "QA" | "SOCIALIZING" | "PREVIEW";

export interface AdminsData {
    [uid: string]: string;
}

export interface User {
    displayName: string;
    email: string;
    uid: string;
}
