import { StreamVideoObject, videoObjectsCreatorParams } from '../types';

export async function streamVideoObjectsCreator({
  files,
  projectKey,
  authorizationToken,
}: videoObjectsCreatorParams): Promise<string[] | null> {
  if (!files.length || !projectKey) {
    return null;
  }
  try {
    const response = await fetch(`https://stream.byteark.com/api/v1/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorizationToken}`,
      },
      body: JSON.stringify({
        projectKey,
        videos: files.map((file) => ({
          title: file.name,
          source: {
            type: file.type,
            size: file.size,
            fileName: file.name,
          },
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Error create Stream video HTTP Error code: ${response.status}`,
      );
    }

    return (await response.json()).map((video: StreamVideoObject) => video.key);
  } catch (error) {
    console.error(error);
    return null;
  }
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

    const result = await response.json();
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
