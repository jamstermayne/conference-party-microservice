type MtmEvent = {
    icsUid: string;
    title: string;
    description?: string;
    location?: string;
    start: Date;
    end?: Date | undefined;
    tz?: string | null;
    lat?: number | null;
    lon?: number | null;
};
export declare function mirrorToGoogle(uid: string, events: MtmEvent[]): Promise<number>;
export {};
//# sourceMappingURL=googleMirror.d.ts.map