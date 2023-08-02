import { PHashingValue as PHashingValueProto } from "../../proto/gen/PHashingValue";

export class PHashingValue {
    constructor(
        public id: number,
        public ofImageId: number,
        public pHashingValue: string,
        public duplicateWithImageId: number
    ) {}

    public static fromProto(
        pHashingValueProto: PHashingValueProto | undefined
    ): PHashingValue {
        return new PHashingValue(
            pHashingValueProto?.pHashingId || 0,
            pHashingValueProto?.ofImageId || 0,
            pHashingValueProto?.pHashingValue || '',
            pHashingValueProto?.duplicateWithImageId || 0
        );
    }
}
