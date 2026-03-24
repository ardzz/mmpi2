export interface ArtifactMetadata {
  key: string;
  contentType: string;
  byteLength: number;
  checksumSha256: string;
  createdAt: Date;
  metadata: Record<string, string>;
}

export interface SaveArtifactInput {
  key: string;
  contentType: string;
  body: Uint8Array;
  metadata?: Record<string, string>;
}

export interface StoredArtifact {
  metadata: ArtifactMetadata;
  body: Uint8Array;
}

export abstract class ArtifactStorage {
  abstract save(input: SaveArtifactInput): Promise<ArtifactMetadata>;
  abstract getMetadata(key: string): Promise<ArtifactMetadata | null>;
  abstract getObject(key: string): Promise<StoredArtifact | null>;
}
