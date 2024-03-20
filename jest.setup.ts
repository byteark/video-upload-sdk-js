import { TextEncoder } from 'util'
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

global.TextEncoder = TextEncoder
// global.fetch = fetchMock;
