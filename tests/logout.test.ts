import { describe, expect, it, vi } from "vitest";
import { logoutOnCurrentOrigin } from "@/lib/auth/logout";

describe("logout redirect", () => {
  it("clears the session without accepting NextAuth's configured-host redirect", async () => {
    const signOut = vi.fn().mockResolvedValue({
      url: "https://expired-tunnel.trycloudflare.com/",
    });
    const navigate = vi.fn();

    await logoutOnCurrentOrigin(signOut, navigate, "/login");

    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    expect(navigate).toHaveBeenCalledWith("/login");
    expect(navigate).not.toHaveBeenCalledWith(
      "https://expired-tunnel.trycloudflare.com/",
    );
  });
});
