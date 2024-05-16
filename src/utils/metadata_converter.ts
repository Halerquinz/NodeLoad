import { injected, token } from "brandi";

export interface MetadataConverter {
    toObject(map: Map<string, any>): Object;
}

export class MetadataConverterImpl implements MetadataConverter {
    public toObject(map: Map<string, any>): Object {
        return Object.fromEntries(map);
    }
}

injected(MetadataConverterImpl);

export const METADATA_CONVERTER_TOKEN = token<MetadataConverter>("MetadataConverter");