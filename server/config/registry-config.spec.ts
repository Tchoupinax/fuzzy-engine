import { afterEach, describe, expect, it } from "vitest";

import {
  getPublicServerConfig,
  resolveProvider,
  resolveScalewayConfig,
} from "./registry-config";

describe("registry-config", () => {
  afterEach(() => {
    delete process.env.FUZZY_ENGINE_PROVIDER;
    delete process.env.SCALEWAY_REGISTRY_URL;
    delete process.env.SCALEWAY_REGISTRY_TOKEN;
  });

  it("resolves provider from environment variables", () => {
    process.env.FUZZY_ENGINE_PROVIDER = "scaleway-registry";

    expect(resolveProvider({})).toBe("scaleway-registry");
  });

  it("accepts scaleway as a provider alias", () => {
    process.env.FUZZY_ENGINE_PROVIDER = "scaleway";

    expect(resolveProvider({})).toBe("scaleway-registry");
  });

  it("uses env credentials when cookie provider is set without secrets", () => {
    process.env.SCALEWAY_REGISTRY_URL = "rg.fr-par.scw.cloud/demo";
    process.env.SCALEWAY_REGISTRY_TOKEN = "secret";

    expect(
      resolveScalewayConfig({
        provider: "scaleway-registry",
        scalewayCredentials: Buffer.from(
          JSON.stringify({ token: "", url: "rg.fr-par.scw.cloud/demo" }),
        ).toString("base64"),
      }),
    ).toEqual({
      token: "secret",
      url: "rg.fr-par.scw.cloud/demo",
    });
  });

  it("prefers cookie provider over environment variables", () => {
    process.env.FUZZY_ENGINE_PROVIDER = "dockerhub";

    expect(
      resolveProvider({
        provider: "scaleway-registry",
      }),
    ).toBe("scaleway-registry");
  });

  it("resolves scaleway credentials from environment variables", () => {
    process.env.FUZZY_ENGINE_PROVIDER = "scaleway-registry";
    process.env.SCALEWAY_REGISTRY_URL = "rg.fr-par.scw.cloud/demo";
    process.env.SCALEWAY_REGISTRY_TOKEN = "secret";

    expect(resolveScalewayConfig({})).toEqual({
      token: "secret",
      url: "rg.fr-par.scw.cloud/demo",
    });
  });

  it("exposes public server config without secrets", () => {
    process.env.FUZZY_ENGINE_PROVIDER = "scaleway-registry";
    process.env.SCALEWAY_REGISTRY_URL = "rg.fr-par.scw.cloud/demo";
    process.env.SCALEWAY_REGISTRY_TOKEN = "secret";

    expect(getPublicServerConfig()).toEqual({
      configured: true,
      provider: "scaleway-registry",
      scalewayRegistry: {
        url: "rg.fr-par.scw.cloud/demo",
      },
    });
  });
});
