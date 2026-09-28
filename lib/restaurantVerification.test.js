import { describe, it, expect } from "vitest";
import { CR_RE, VAT_RE, MAPS_RE, normalizeDigits } from "./restaurantVerification";

describe("restaurant verification rules", () => {
  it("normalizes Arabic-Indic digits and separators", () => {
    expect(normalizeDigits("١٠١٠ ١٢٣-٤٥٦")).toBe("1010123456");
    expect(normalizeDigits("۳۰۰")).toBe("300");
  });

  it("validates CR numbers", () => {
    expect(CR_RE.test("1010123456")).toBe(true);
    expect(CR_RE.test("101012345")).toBe(false);
    expect(CR_RE.test("10101234567")).toBe(false);
  });

  it("validates VAT numbers", () => {
    expect(VAT_RE.test("300000000000003")).toBe(true);
    expect(VAT_RE.test("100000000000003")).toBe(false);
    expect(VAT_RE.test("30000000000003")).toBe(false);
  });

  it("accepts only Google Maps links", () => {
    expect(MAPS_RE.test("https://maps.app.goo.gl/AbC123")).toBe(true);
    expect(MAPS_RE.test("https://www.google.com/maps/place/x")).toBe(true);
    expect(MAPS_RE.test("https://www.google.com.sa/maps/@24.7,46.6,15z")).toBe(true);
    expect(MAPS_RE.test("http://maps.app.goo.gl/AbC123")).toBe(false);
    expect(MAPS_RE.test("https://evil.com/maps")).toBe(false);
  });
});
