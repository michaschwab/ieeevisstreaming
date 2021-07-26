
export interface Track {
    name: string;
    currentStatus: {
        videoIndex: number;
        videoStartTimestamp: number;
    };
    videos: {
        [index: string]: {
            title: string;
            type: "prerecorded"|"live";
            youtubeId: string;
        }
    };
    slido: string;
    discordGuildId: string;
    discordChannelId: string;
}
