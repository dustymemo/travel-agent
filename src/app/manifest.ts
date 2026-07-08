import type { MetadataRoute } from "next";
import { manifest as config } from "@/lib/pwa/manifest";

// Next serves this at /manifest.webmanifest and auto-links it in <head>.
export default function manifest(): MetadataRoute.Manifest {
  return config;
}
