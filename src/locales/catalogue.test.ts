// Feature: performance-and-i18n-improvements, Property 2: Translation catalogue completeness
import * as fc from "fast-check";
import en from "./en.json";
import sw from "./sw.json";

describe("Translation catalogue completeness (Property 2)", () => {
  const enKeys = Object.keys(en) as (keyof typeof en)[];

  it("Property 2: every key in en.json exists in sw.json with a non-empty value", () => {
    fc.assert(
      fc.property(fc.constantFrom(...enKeys), (key) => {
        const swValue = (sw as Record<string, string>)[key];
        return typeof swValue === "string" && swValue.length > 0;
      }),
    );
  });
});
