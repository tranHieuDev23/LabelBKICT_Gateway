import { PinnedPage as PinnedPageProto } from "../../proto/gen/PinnedPage";

export class PinnedPage {
    constructor(
        public id: number,
        public pinTime: number,
        public url: string,
        public description: string,
        public screenshot_url: string
    ) {}
}
