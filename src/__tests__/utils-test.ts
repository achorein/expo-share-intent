import { parseShareIntent } from "../utils";

jest.mock("../useShareIntent", () => ({
  SHAREINTENT_DEFAULTVALUE: {
    files: null,
    text: null,
    webUrl: null,
    type: null,
  },
}));

describe("parseShareIntent", () => {
  it.each([null, undefined, "", 17])(
    "handles a missing runtime MIME value: %p",
    (mimeType) => {
      const result = parseShareIntent(
        {
          files: [
            {
              contentUri: "content://provider/recipe.bin",
              mimeType,
            },
          ],
        } as never,
        { debug: false },
      );

      expect(result.type).toBe("file");
      expect(result.files?.[0]?.mimeType).toBe("application/octet-stream");
    },
  );

  it("ignores null file entries", () => {
    const result = parseShareIntent(
      {
        files: [
          null,
          {
            contentUri: "content://provider/photo.jpg",
            mimeType: "image/jpeg",
          },
        ],
      } as never,
      { debug: false },
    );

    expect(result.type).toBe("media");
    expect(result.files).toHaveLength(1);
  });

  it("does not classify an empty file list as media", () => {
    const result = parseShareIntent({ files: [] } as never, { debug: false });

    expect(result.type).toBe("file");
  });
});
