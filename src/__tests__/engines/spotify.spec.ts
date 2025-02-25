import { YouTubeStream } from "play-dl";
import spotify, { Tracks } from "spotify-url-info";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { spotifyEngine, SpotifyPlaylist } from "../../engines/spotify";
import { youtubeEngine } from "../../engines/youtube";
import { Playlist, Track } from "../../types/engines";

const expectedTrack = {
  url: "testUrl",
  title: "testTitle",
  duration: 123,
  source: "spotify",
  artist: "testArtist1, testArtist2",
} satisfies Track;

const expectedPlaylist = {
  title: "testPlaylistTitle",
  url: "https://open.spotify.com/playlist/3xMQTDLOIGvj3lWH5e5x6F",
  thumbnailUrl: "testPlaylistThumbnail",
} satisfies Playlist;

vi.mock("spotify-url-info", async (importOriginal) => {
  const module: Record<string, unknown> = await importOriginal();

  return {
    ...module,
    default: vi.fn(() => {
      return {
        getTracks: vi.fn(() =>
          Promise.resolve([
            {
              ...mock<Tracks>({
                name: expectedTrack.title,
                duration: expectedTrack.duration * 1000,
                artist: expectedTrack.artist,
              }),
            },
          ])
        ),
        getData: vi.fn(() =>
          Promise.resolve({
            ...mock<SpotifyPlaylist>({
              coverArt: { sources: [{ url: expectedPlaylist.thumbnailUrl }] },
              name: expectedPlaylist.title,
              type: "playlist",
              trackList: new Array(100).fill("").map(() => ({
                ...mock<Tracks>({
                  name: expectedTrack.title,
                  duration: expectedTrack.duration * 1000,
                  artist: expectedTrack.artist,
                }),
              })),
            }),
          })
        ),
        getDetails: vi.fn(),
        getPreview: vi.fn(),
      } as ReturnType<typeof spotify>;
    }),
  };
});

describe.concurrent("spotify engine", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("has source", () => {
    expect(spotifyEngine.source).toBe("spotify");
  });

  it.each(["https://open.spotify.com/"])("is responsible for %s", (query) => {
    let isResponsible = spotifyEngine.isResponsible(query);
    expect(isResponsible).toBe(true);

    isResponsible = spotifyEngine.isResponsible(
      query.replace("https://", "http://")
    );
    expect(isResponsible).toBe(true);
  });

  it("should search track", async () => {
    const result = await spotifyEngine.search(expectedTrack.url, {}, {});
    expect(result.length).toBe(1);
    expect(result[0].source).toBe(spotifyEngine.source);
    expect(result[0].tracks.length).toBe(1);
    expect(result[0].tracks[0]).toEqual(expectedTrack);
    expect(result[0].playlist).toBeUndefined();
  });

  it("searches playlist", async () => {
    const searchResults = await spotifyEngine.search(
      expectedPlaylist.url,
      {},
      {}
    );
    const result = searchResults[0];
    expect(result).toBeDefined();
    expect(result.tracks.length).toBeGreaterThanOrEqual(1);
    expect(result.source).toBe("spotify");
    expect(result.playlist).toBeDefined();
    expect(result.tracks.length).toBe(100);
    expect(result.playlist).toEqual(expectedPlaylist);

    result.tracks.forEach((track) => {
      expect(track.playlist).toBeDefined();
      expect(track.playlist).toEqual(expectedPlaylist);
      expect(track.playlist).toBe(result.playlist);
    });
  });

  it("searches playlist with limit", async () => {
    const limit = 64;
    const searchResults = await spotifyEngine.search(
      "https://open.spotify.com/playlist/3xMQTDLOIGvj3lWH5e5x6F",
      {},
      { limit }
    );

    const result = searchResults[0];
    expect(result).toBeDefined();
    expect(result.tracks.length).toBe(limit);
  });

  it("gets stream", async () => {
    const youtubeSearchSpy = vi
      .spyOn(youtubeEngine, "search")
      .mockResolvedValue([
        { source: youtubeEngine.source, tracks: [expectedTrack] },
      ]);
    const youtubeStreamSpy = vi
      .spyOn(youtubeEngine, "getStream")
      .mockResolvedValue(mock<YouTubeStream>());

    await spotifyEngine.getStream(expectedTrack, {});
    expect(youtubeSearchSpy).toHaveBeenCalledOnce();
    expect(youtubeSearchSpy).toHaveBeenCalledWith(
      `${expectedTrack.title} testArtist1, testArtist2`,
      {},
      { limit: 1 }
    );
    expect(youtubeStreamSpy).toHaveBeenCalledOnce();
  });
});
