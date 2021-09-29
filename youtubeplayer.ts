export interface YoutubePlayer {
    playVideo: () => void;
    //playVideoAt: (time: number) => void;
    pauseVideo: () => void;
    stopVideo: () => void;
    loadVideoById: (videoId: string, startTime?: number, size?: string) => void;
    mute: () => void;
    unMute: () => void;
    seekTo: (timeS: number, allowSeekAhead: boolean) => void;
    getDuration: () => number;
    getCurrentTime: () => number;
    setSize(width: number, height: number): void;
}

export enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5
}