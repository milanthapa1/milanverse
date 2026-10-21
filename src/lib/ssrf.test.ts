import { describe, expect, it } from "vitest";
import {
  assertSafeUrl,
  isBlockedIp,
  isBlockedIpv4,
  isBlockedIpv6,
  SsrfError,
} from "@/lib/ssrf";

describe("isBlockedIpv4", () => {
  it("blocks loopback, private, link-local and metadata ranges", () => {
    const blocked = [
      "0.0.0.0",
      "10.0.0.1",
      "10.255.255.254",
      "100.64.0.1",
      "100.100.100.200",
      "127.0.0.1",
      "127.255.255.255",
      "169.254.1.1",
      "169.254.169.254",
      "172.16.0.1",
      "172.31.255.254",
      "192.0.0.1",
      "192.0.2.10",
      "192.168.0.1",
      "192.168.255.255",
      "198.18.0.1",
      "198.51.100.7",
      "203.0.113.9",
      "224.0.0.1",
      "255.255.255.255",
    ];
    for (const ip of blocked) {
      expect(isBlockedIpv4(ip), ip).toBe(true);
    }
  });

  it("allows public addresses", () => {
    for (const ip of ["1.1.1.1", "8.8.8.8", "93.184.216.34", "172.32.0.1", "198.20.0.1"]) {
      expect(isBlockedIpv4(ip), ip).toBe(false);
    }
  });

  it("treats unparseable input as unsafe", () => {
    expect(isBlockedIpv4("not-an-ip")).toBe(true);
    expect(isBlockedIpv4("999.1.1.1")).toBe(true);
    expect(isBlockedIpv4("1.2.3")).toBe(true);
  });
});

describe("isBlockedIpv6", () => {
  it("blocks loopback, unique-local, link-local, NAT64 and mapped IPv4", () => {
    const blocked = [
      "::",
      "::1",
      "fc00::1",
      "fd00::1",
      "fd00:ec2::254",
      "fe80::1",
      "febf::1",
      "ff02::1",
      "64:ff9b::7f00:1",
      "2001:db8::1",
      "::ffff:127.0.0.1",
      "::ffff:10.0.0.1",
      "::ffff:7f00:1",
      "[::1]",
    ];
    for (const ip of blocked) {
      expect(isBlockedIpv6(ip), ip).toBe(true);
    }
  });

  it("allows public IPv6 addresses", () => {
    for (const ip of ["2606:4700:4700::1111", "2001:4860:4860::8888"]) {
      expect(isBlockedIpv6(ip), ip).toBe(false);
    }
  });

  it("routes by family through isBlockedIp", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("2606:4700:4700::1111")).toBe(false);
  });
});

describe("assertSafeUrl", () => {
  // Every case below is rejected before DNS resolution, so the suite stays
  // offline and deterministic.
  const rejected: Array<[string, string]> = [
    ["file:///etc/passwd", "file scheme"],
    ["ftp://example.com/file", "ftp scheme"],
    ["javascript:alert(1)", "javascript scheme"],
    ["http://user:password@example.com", "embedded credentials"],
    ["http://localhost/", "localhost"],
    ["http://localhost:3000/admin", "localhost with port"],
    ["http://127.0.0.1/", "loopback IPv4"],
    ["http://10.0.0.5/", "private IPv4"],
    ["http://192.168.0.1/", "private IPv4 (192.168)"],
    ["http://172.16.0.1/", "private IPv4 (172.16)"],
    ["http://169.254.169.254/latest/meta-data/", "cloud metadata"],
    ["http://metadata.google.internal/", "GCP metadata hostname"],
    ["http://[::1]/", "IPv6 loopback"],
    ["http://0.0.0.0/", "unspecified address"],
  ];

  it.each(rejected)("rejects %s (%s)", async (url) => {
    await expect(assertSafeUrl(url)).rejects.toBeInstanceOf(SsrfError);
  });

  it("accepts a public IP literal without touching DNS", async () => {
    const url = await assertSafeUrl("http://8.8.8.8/");
    expect(url.hostname).toBe("8.8.8.8");
    expect(url.protocol).toBe("http:");
  });

  it("does not SSRF-block a legitimate public domain before DNS resolution", async () => {
    // Regression test: previously isBlockedIp() was called with the raw
    // hostname string (e.g. "codeshare.io") which ipv4Octets() could not parse,
    // causing it to return true (safe-side default) and throw SSRF_BLOCKED
    // for any domain that wasn't a literal numeric IP.
    // The fix: only call isBlockedIp() when isIP(hostname) !== 0.
    // We use example.com (IANA reserved, always stable) to stay offline-friendly.
    // The call reaches DNS resolution — mock it via vitest if offline is required.
    await expect(assertSafeUrl("https://example.com/")).resolves.toBeDefined();
  });
});
