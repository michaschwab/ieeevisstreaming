export interface YoutubePlayer {
    playVideo: () => void;
    pauseVideo: () => void;
    loadVideoById: (videoId: string, something?: number, size?: string) => void;
    mute: () => void;
    unMute: () => void;
    seekTo: (timeS: number, allowSeekAhead: boolean) => void;
}