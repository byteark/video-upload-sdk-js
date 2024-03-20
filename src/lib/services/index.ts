import {
  QoderVideoObject,
  StreamVideoObject,
  VideoObjectsCreatorProps,
} from '../types';

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
    : `https://qoder.byteark.com/apps/${appId}/ajax/videos`;

  const requestBody = isStream
    ? {
        projectKey,
        videos: files.map((file) => ({
          title: file.name,
          source: {
            type: file.type,
            size: file.size,
            fileName: file.name,
          },
        })),
      }
    : files.map((file) => ({
        title: file.name,
        size: file.size,
        project: {
          id: projectKey,
        },
      }));

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

    console.log(data);

    if (isStream) {
      return data.map((video: StreamVideoObject) => video.key);
    }

    return data.map((video: QoderVideoObject) => video.source.id);
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
