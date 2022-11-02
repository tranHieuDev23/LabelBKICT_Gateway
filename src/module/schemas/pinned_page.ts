export class PinnedPage {
    constructor(
        public id: number,
        public pin_time: number,
        public url: string,
        public description: string,
        public screenshot_url: string
    ) {}
}
