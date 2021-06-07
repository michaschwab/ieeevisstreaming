export interface YoutubePlayer {
    playVideo: () => void;
    pauseVideo: () => void;
    loadVideoById: (videoId: string, startTime?: number, size?: string) => void;
    mute: () => void;
    unMute: () => void;
    seekTo: (timeS: number, allowSeekAhead: boolean) => void;
    getDuration: () => number;
}

export enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5
}