
export interface Track {
    name: string;
    currentStatus: {
        status: "online"|"offline";
        videoIndex: number;
        videoStartTime: number;
        videoStartTimestamp: number;
    };
    videos: {
        [index: string]: {
            title: string;
            type: "prerecorded"|"live";
            youtubeId: string;
        }
    };
}