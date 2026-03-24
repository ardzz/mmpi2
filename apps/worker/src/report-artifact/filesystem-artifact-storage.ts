import { createHash } from 'node:crypto';
import {
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import {
  dirname,
  join,
  normalize,
  resolve,
} from 'node:path';
import { Injectable } from '@nestjs/common';
import {
  ArtifactStorage,
  type ArtifactMetadata,
  type SaveArtifactInput,
  type StoredArtifact,
} from './artifact-storage';

@Injectable()
export class FileSystemArtifactStorage extends ArtifactStorage {
  private readonly rootDirectory: string;

  constructor(rootDirectory?: string) {
    super();
    this.rootDirectory = resolve(rootDirectory ?? 'var/artifacts');
  }

  async save(input: SaveArtifactInput): Promise<ArtifactMetadata> {
    const objectPath = this.toObjectPath(input.key);
    const metadataPath = this.toMetadataPath(input.key);

    await mkdir(dirname(objectPath), {
      recursive: true,
    });

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

    await writeFile(objectPath, input.body);
    await writeFile(metadataPath, JSON.stringify(this.toPersistedMetadata(metadata), null, 2), 'utf8');

    return metadata;
  }

  async getMetadata(key: string): Promise<ArtifactMetadata | null> {
    const metadataPath = this.toMetadataPath(key);

    try {
      const rawMetadata = await readFile(metadataPath, 'utf8');
      const persisted = JSON.parse(rawMetadata) as PersistedMetadata;

      return {
        key: persisted.key,
        contentType: persisted.contentType,
        byteLength: persisted.byteLength,
        checksumSha256: persisted.checksumSha256,
        createdAt: new Date(persisted.createdAt),
        metadata: {
          ...(persisted.metadata ?? {}),
        },
      };
    } catch {
      return null;
    }
  }

  async getObject(key: string): Promise<StoredArtifact | null> {
    const objectPath = this.toObjectPath(key);
    const metadata = await this.getMetadata(key);
    if (metadata === null) {
      return null;
    }

    try {
      const body = await readFile(objectPath);
      return {
        metadata,
        body: new Uint8Array(body),
      };
    } catch {
      return null;
    }
  }

  private toObjectPath(key: string): string {
    return this.toScopedPath(key, '.bin');
  }

  private toMetadataPath(key: string): string {
    return this.toScopedPath(key, '.meta.json');
  }

  private toScopedPath(key: string, extension: string): string {
    const sanitizedKey = this.sanitizeKey(key);
    const targetPath = resolve(join(this.rootDirectory, `${sanitizedKey}${extension}`));

    if (!targetPath.startsWith(this.rootDirectory)) {
      throw new Error(`Artifact key '${key}' resolves outside storage root.`);
    }

    return targetPath;
  }

  private sanitizeKey(key: string): string {
    const normalized = normalize(key.replace(/\\/g, '/')).replace(/^\/+/, '');
    if (normalized.length === 0 || normalized.startsWith('..') || normalized.includes('/../')) {
      throw new Error(`Artifact key '${key}' is invalid.`);
    }

    return normalized;
  }

  private toPersistedMetadata(metadata: ArtifactMetadata): PersistedMetadata {
    return {
      key: metadata.key,
      contentType: metadata.contentType,
      byteLength: metadata.byteLength,
      checksumSha256: metadata.checksumSha256,
      createdAt: metadata.createdAt.toISOString(),
      metadata: {
        ...metadata.metadata,
      },
    };
  }
}

interface PersistedMetadata {
  key: string;
  contentType: string;
  byteLength: number;
  checksumSha256: string;
  createdAt: string;
  metadata: Record<string, string>;
}
