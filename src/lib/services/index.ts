import {
  QoderVideoObject,
  StreamVideoObject,
  VideoFileObject,
  VideoObjectsCreatorProps,
} from '../types';
import { isVideoFileObjects } from '../utils/typeGuard';

export async function videoObjectsCreator(
  props: VideoObjectsCreatorProps,
): Promise<string[]> {
  const { appId, authorizationToken, files, projectKey, serviceName } = props;

  const isStream = serviceName === 'byteark.stream';
  const isQoder = serviceName === 'byteark.qoder';

  if (!files.length || !projectKey || (isQoder && !appId)) {
    return Promise.resolve(null);
  }

  const requestUrl = isStream
    ? 'https://stream.byteark.com/api/v1/videos'
    : `https://qoder.byteark.com/apps/${appId}/ajax/videos/bulk`;

  let videoFileObjects: VideoFileObject[] = [];

  if (isVideoFileObjects(files)) {
    videoFileObjects = files.map((videoFileObject) => ({
      ...videoFileObject,
      videoMetadata: {
        ...videoFileObject.videoMetadata,
        title: videoFileObject.videoMetadata.title ?? videoFileObject.file.name,
      },
    }));
  } else {
    videoFileObjects = Array.from(files).map((file) => ({
      file,
      videoMetadata: {
        title: file.name,
      },
    }));
  }

  const requestBody = isStream
    ? {
        projectKey,
        videos: videoFileObjects.map((videoFileObject) => ({
          ...videoFileObject.videoMetadata,
          source: {
            type: videoFileObject.file.type,
            size: videoFileObject.file.size,
            fileName: videoFileObject.file.name,
          },
        })),
      }
    : {
        videos: videoFileObjects.map((videoFileObject) => ({
          title: videoFileObject.videoMetadata.name,
          size: videoFileObject.file.size,
          project: {
            id: projectKey,
          },
        })),
      };

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorizationToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Error create ${isStream ? 'Stream' : 'Qoder'} video HTTP Error code: ${response.status}`,
      );
    }

    const data = await response.json();

    if (isStream) {
      return data.map((video: StreamVideoObject) => video.key);
    }

    return data.map((video: QoderVideoObject) => video.object.source.id);
  } catch (error) {
    console.error(error);
    return [];
  }
}

interface AccessTokenResponse {
  accessToken: string;
}

export async function getStreamAccessToken(
  formId: string,
  token: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://stream.byteark.com/api/auth/v1/public/apps/${formId}/access-tokens`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appToken: token,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Error fetching Stream access token HTTP Error code: ${response.status}`,
      );
    }

    const result: AccessTokenResponse = await response.json();
    if (result.accessToken) {
      return result.accessToken;
    }

    return null;
  } catch (error) {
    console.error(
      'Error fetching Stream access token:',
      (error as Error).message,
    );
    return null;
  }
}
