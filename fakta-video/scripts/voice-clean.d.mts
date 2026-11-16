// Types for scripts/voice-clean.mjs (shared with whatif-video; see that file for what it does)
export declare const readMonoWav: (file: string) => { s: Float32Array; sr: number };
export declare const writeMonoWav: (file: string, s: Float32Array, sr: number) => void;
export declare const frames: (s: Float32Array, sr: number) => { l: number; z: number }[];
export declare const DENOISE: string;
export declare const denoise: (s: Float32Array, sr: number, ffmpeg?: string) => Float32Array;
export declare const cleanEdges: (s: Float32Array, sr: number) => Float32Array;
export declare const FADE_IN: number;
export declare const FADE_OUT: number;
export declare const fades: (s: Float32Array, sr: number) => Float32Array;
export declare const cleanLine: (s: Float32Array, sr: number) => Float32Array;
export declare const checkLines: (clips: Float32Array[], sr: number) => { line: number; ok: boolean; problems: string[] }[];
