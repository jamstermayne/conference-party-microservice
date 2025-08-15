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
export declare function fetchIcs(url: string): Promise<string>;
export declare function parseIcs(text: string): MtmEvent[];
export declare function syncUserMtm(uid: string): Promise<{
    count: number;
}>;
export {};
//# sourceMappingURL=service.d.ts.map