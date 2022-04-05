import { injected, token } from "brandi";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../../../config";
import { PinnedPage as PinnedPageProto } from "../../../proto/gen/PinnedPage";
import { PinnedPage } from "../pinned_page";

export interface PinnedPageProtoToPinnedPageConverter {
    convert(pinnedPageProto: PinnedPageProto | undefined): PinnedPage;
}

export class PinnedPageProtoToPinnedPageConverterImpl
    implements PinnedPageProtoToPinnedPageConverter
{
    constructor(private readonly applicationConfig: ApplicationConfig) {}

    public convert(pinnedPageProto: PinnedPageProto | undefined): PinnedPage {
        return new PinnedPage(
            pinnedPageProto?.id || 0,
            +(pinnedPageProto?.pinTime || 0),
            pinnedPageProto?.url || "",
            pinnedPageProto?.description || "",
            this.getScreenshotURL(pinnedPageProto?.screenshotFilename || "")
        );
    }

    private getScreenshotURL(screenshotFilename: string): string {
        return `/${this.applicationConfig.screenshotImageURLPrefix}/${screenshotFilename}`;
    }
}

injected(PinnedPageProtoToPinnedPageConverterImpl, APPLICATION_CONFIG_TOKEN);

export const PINNED_PAGE_PROTO_TO_PINNED_PAGE_CONVERTER_TOKEN =
    token<PinnedPageProtoToPinnedPageConverter>(
        "PinnedPageProtoToPinnedPageConverter"
    );
