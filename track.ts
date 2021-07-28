export interface Track {
    name: string;
    currentStatus: VideoStatus;
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