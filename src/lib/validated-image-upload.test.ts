import { describe, expect, it } from "vitest";
import { ImageUploadValidationError, validateImageUpload } from "./validated-image-upload";

describe("validateImageUpload", () => {
  it("accepts an image whose bytes match its declared MIME type", async () => {
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      "photo.png",
      { type: "image/png" },
    );

    await expect(validateImageUpload(file, 1024)).resolves.toMatchObject({
      contentType: "image/png",
      extension: "png",
    });
  });

  it("rejects a MIME type that does not match the file signature", async () => {
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      "photo.jpg",
      { type: "image/jpeg" },
    );

    await expect(validateImageUpload(file, 1024)).rejects.toBeInstanceOf(ImageUploadValidationError);
  });

  it("rejects unlisted content types", async () => {
    const file = new File(["<svg onload=alert(1) />"], "photo.svg", { type: "image/svg+xml" });

    await expect(validateImageUpload(file, 1024)).rejects.toBeInstanceOf(ImageUploadValidationError);
  });
});
