export namespace imagekitIOType {
  export type Files = {
    type: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    fileId: string;
    tags: any;
    AITags: any;
    versionInfo: VersionInfo;
    embeddedMetadata: EmbeddedMetadata;
    isPublished: boolean;
    customCoordinates: any;
    customMetadata: CustomMetadata;
    isPrivateFile: boolean;
    url: string;
    thumbnail: string;
    fileType: string;
    filePath: string;
    height: number;
    width: number;
    size: number;
    hasAlpha: boolean;
    mime: string;
  };

  interface VersionInfo {
    id: string;
    name: string;
  }

  interface EmbeddedMetadata {
    ImageHeight: number;
    ImageWidth: number;
    DateCreated: string;
    DateTimeCreated: string;
  }

  interface CustomMetadata {
    [key: string]: unknown;
  }
}
