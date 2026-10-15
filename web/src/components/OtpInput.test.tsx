import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtpInput } from "./OtpInput";

describe("OtpInput", () => {
  it("renders one box per digit", () => {
    render(<OtpInput value="" onChange={() => {}} length={6} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
  });

  it("shows the supplied digits", () => {
    render(<OtpInput value="582" onChange={() => {}} />);
    const boxes = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(boxes[0].value).toBe("5");
    expect(boxes[1].value).toBe("8");
    expect(boxes[2].value).toBe("2");
    expect(boxes[3].value).toBe("");
  });

  it("emits typed digits", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);
    await user.type(screen.getByLabelText("One-time password digit 1"), "5");
    expect(onChange).toHaveBeenCalledWith("5");
  });

  it("ignores non-digit input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);
    await user.type(screen.getByLabelText("One-time password digit 1"), "a");
    expect(onChange).not.toHaveBeenCalled();
  });
});
