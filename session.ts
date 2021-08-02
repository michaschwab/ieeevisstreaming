export interface Session {
    name: string;
    currentStatus: VideoStatus;
    discord: string;
    slido: string;
    videos: {
        [index: string]: Video;
    };
}

export interface VideoStatus {
    videoIndex: number;
    videoStartTimestamp: number;
}

export interface Video {
    title: string;
    type: "prerecorded"|"live";
    youtubeId: string;
}