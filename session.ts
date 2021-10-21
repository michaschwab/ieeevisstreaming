export interface Session {
    name: string;
    currentStatus: SessionStatus;
    room: string;
    time_start: string;
    time_end: string;
    stages: {
        [index: string]: SessionStage;
    };
    notes: string;
    has_live_captions: boolean;
    live_captions_url: string;
    zoom_url: string;
    chairs: string;
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
    liveStreamStartTimestamp: number;
}

export interface SessionStage {
    title: string;
    live?: boolean;
    youtubeId?: string;
    imageUrl?: string;
    state: SessionState;
    time_start?: string;
    time_end?: string;
    contributors?: string;
    paper_uid?: string;
    video_length: string;
    slido_label?: string;
    notes: string;
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

export interface Log {
    room: string;
    session: string;
    status: SessionStatus;
    time: number;
    admin: string;
    youtubeId: string;
    title: string;
}

export interface RoomDayLogs {
    [timestamp: string]: Log
}
