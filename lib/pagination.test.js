import { describe, it, expect } from "vitest";
import { pageQuery, pageRange, parsePage, totalPages } from "./pagination.js";

describe("pagination", () => {
  it("parses the page param, falling back to 1", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
  });

  it("computes the inclusive row range", () => {
    expect(pageRange(1, 24)).toEqual([0, 23]);
    expect(pageRange(3, 24)).toEqual([48, 71]);
  });

  it("counts pages, with at least one", () => {
    expect(totalPages(0, 24)).toBe(1);
    expect(totalPages(24, 24)).toBe(1);
    expect(totalPages(25, 24)).toBe(2);
  });

  it("builds a page link that keeps the filters", () => {
    const params = { type: "food", q: "shawarma", city: "", page: "2" };
    expect(pageQuery(params, 3)).toBe("?type=food&q=shawarma&page=3");
    expect(pageQuery(params, 1)).toBe("?type=food&q=shawarma");
    expect(pageQuery({}, 1)).toBe("");
  });
});
