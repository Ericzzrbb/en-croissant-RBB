import { expect, test } from "vitest";
import {
    backgroundFileExtension,
    backgroundImageFileName,
    backgroundLayerStyle,
    clampBackgroundBrightness,
    clampBackgroundOpacity,
    contrastColorForBackground,
    cssUrl,
    isSupportedBackgroundImage,
    sanitizeBackgroundColor,
    sanitizeFontFamily,
} from "@/utils/background";

test("recognizes supported background images case-insensitively", () => {
    expect(backgroundFileExtension("/home/user/Wallpaper.PNG")).toBe("png");
    expect(backgroundFileExtension("C:\\pictures\\photo.jpeg")).toBe("jpeg");
    expect(isSupportedBackgroundImage("a.webp")).toBe(true);
    expect(isSupportedBackgroundImage("a.svg")).toBe(true);
});

test("rejects files that are not background images", () => {
    expect(backgroundFileExtension("/home/user/notes.txt")).toBeNull();
    expect(backgroundFileExtension("/home/user/archive.tar.gz")).toBeNull();
    expect(isSupportedBackgroundImage("")).toBe(false);
});

test("extracts the file name of the stored image", () => {
    expect(backgroundImageFileName("C:\\Users\\me\\backgrounds\\background-1.png")).toBe(
        "background-1.png",
    );
    expect(backgroundImageFileName("/home/me/backgrounds/background-1.png")).toBe(
        "background-1.png",
    );
});

test("clamps transparency and brightness to their slider ranges", () => {
    expect(clampBackgroundOpacity(50)).toBe(50);
    expect(clampBackgroundOpacity(-10)).toBe(0);
    expect(clampBackgroundOpacity(150)).toBe(100);
    expect(clampBackgroundOpacity(Number.NaN)).toBe(100);

    expect(clampBackgroundBrightness(100)).toBe(100);
    expect(clampBackgroundBrightness(-10)).toBe(0);
    expect(clampBackgroundBrightness(250)).toBe(200);
    expect(clampBackgroundBrightness(Number.NaN)).toBe(100);
});

test("builds the shared layer style", () => {
    const style = backgroundLayerStyle({
        imageUrl: "http://asset.localhost/background.png",
        color: "#1a1b1e",
        opacity: 50,
        brightness: 150,
    });

    expect(style.backgroundImage).toBe('url("http://asset.localhost/background.png")');
    expect(style.backgroundColor).toBe("#1a1b1e");
    expect(style.backgroundSize).toBe("cover");
    expect(style.backgroundPosition).toBe("center");
    expect(style.backgroundRepeat).toBe("no-repeat");
    expect(style.opacity).toBe(0.5);
    expect(style.filter).toBe("brightness(150%)");
});

test("omits empty image and color values", () => {
    const style = backgroundLayerStyle({ imageUrl: null, color: "", opacity: 100, brightness: 100 });
    expect(style.backgroundImage).toBeUndefined();
    expect(style.backgroundColor).toBeUndefined();
    expect(style.opacity).toBe(1);
});

test("quotes and escapes CSS urls", () => {
    expect(cssUrl('a"b.png')).toBe('url("a%22b.png")');
    expect(cssUrl("a\\b.png")).toBe('url("a%5Cb.png")');
});

test("strips CSS injection characters from font families", () => {
    expect(sanitizeFontFamily("  Microsoft YaHei, sans-serif  ")).toBe(
        "Microsoft YaHei, sans-serif",
    );
    expect(sanitizeFontFamily("serif;} body { display: none }")).toBe(
        "serif body display: none",
    );
    expect(sanitizeFontFamily("<script>")).toBe("script");
});

test("only accepts hex background colors", () => {
    expect(sanitizeBackgroundColor("#1A1B1E")).toBe("#1A1B1E");
    expect(sanitizeBackgroundColor("#fff")).toBe("#fff");
    expect(sanitizeBackgroundColor("#11223344")).toBe("#11223344");
    expect(sanitizeBackgroundColor("")).toBe("");
    expect(sanitizeBackgroundColor("red; display: none")).toBe("");
    expect(sanitizeBackgroundColor("var(--mantine-color-body)")).toBe("");
});

test("picks readable text colors for the background theme color", () => {
    expect(contrastColorForBackground("#1A1B1E")).toBe("#ffffff");
    expect(contrastColorForBackground("#000000")).toBe("#ffffff");
    expect(contrastColorForBackground("#FFFFFF")).toBe("#000000");
    expect(contrastColorForBackground("#F8F9FA")).toBe("#000000");
    expect(contrastColorForBackground("#fff")).toBe("#000000");
    expect(contrastColorForBackground("not-a-color")).toBe("#ffffff");
});
