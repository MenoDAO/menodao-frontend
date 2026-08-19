import { formatPct, formatPctChange, sparkBars } from "./format";

describe("care intelligence formatters", () => {
  it("formats 9/120 as 7.5%", () => {
    expect(formatPct(9 / 120)).toBe("7.5%");
  });

  it("does not render a fake 0% when the ratio is missing", () => {
    expect(formatPct(null)).toBe("—");
    expect(formatPctChange(null)).toBe("—");
  });

  it("builds a compact trend from monthly values", () => {
    expect(sparkBars([1, 2, 3, 8])).toMatch(/[▁▂▃▄▅▆▇█]+/);
  });
});
