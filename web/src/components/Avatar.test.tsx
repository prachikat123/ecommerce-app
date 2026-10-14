import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("shows the photo when a source is provided", () => {
    render(<Avatar src="data:image/png;base64,AAAA" name="Ravi Patil" size={64} />);
    const img = screen.getByAltText("Ravi Patil's profile photo") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("data:image/png;base64,AAAA");
  });

  it("falls back to initials when there is no photo", () => {
    render(<Avatar name="Ravi Patil" size={64} />);
    expect(screen.getByText("RP")).toBeTruthy();
  });

  it("renders a role icon when neither photo nor name is set", () => {
    const { container } = render(<Avatar role="SELLER" size={64} />);
    expect(container.textContent).toContain("storefront");
  });
});
