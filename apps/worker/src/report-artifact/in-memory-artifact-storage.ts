import { createHash } from 'node:crypto';
import {
  ArtifactStorage,
  type ArtifactMetadata,
  type SaveArtifactInput,
  type StoredArtifact,
} from './artifact-storage';

export class InMemoryArtifactStorage extends ArtifactStorage {
  private readonly objectsByKey = new Map<string, StoredArtifact>();

  async save(input: SaveArtifactInput): Promise<ArtifactMetadata> {
    const now = new Date();
    const metadata: ArtifactMetadata = {
      key: input.key,
      contentType: input.contentType,
      byteLength: input.body.byteLength,
      checksumSha256: createHash('sha256').update(input.body).digest('hex'),
      createdAt: now,
      metadata: {
        ...(input.metadata ?? {}),
      },
    };

    this.objectsByKey.set(input.key, {
      metadata,
      body: new Uint8Array(input.body),
    });

    return {
      ...metadata,
      metadata: {
        ...metadata.metadata,
      },
      createdAt: new Date(metadata.createdAt),
    };
  }

  async getMetadata(key: string): Promise<ArtifactMetadata | null> {
    const artifact = this.objectsByKey.get(key);
    if (artifact === undefined) {
      return null;
    }

    return {
      ...artifact.metadata,
      metadata: {
        ...artifact.metadata.metadata,
      },
      createdAt: new Date(artifact.metadata.createdAt),
    };
  }

  async getObject(key: string): Promise<StoredArtifact | null> {
    const artifact = this.objectsByKey.get(key);
    if (artifact === undefined) {
      return null;
    }

    return {
      metadata: {
        ...artifact.metadata,
        metadata: {
          ...artifact.metadata.metadata,
        },
        createdAt: new Date(artifact.metadata.createdAt),
      },
      body: new Uint8Array(artifact.body),
    };
  }
}
