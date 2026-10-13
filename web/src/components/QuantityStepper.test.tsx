import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuantityStepper } from "./QuantityStepper";

describe("QuantityStepper", () => {
  it("renders the current value", () => {
    render(<QuantityStepper value={2} onChange={() => {}} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("increments and decrements within bounds", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityStepper value={1} min={1} max={3} onChange={onChange} />);

    await user.click(screen.getByLabelText("Increase quantity"));
    expect(onChange).toHaveBeenCalledWith(2);

    // At the minimum, the decrement control is disabled.
    expect(screen.getByLabelText("Decrease quantity")).toBeDisabled();
  });

  it("does not exceed the maximum", () => {
    render(<QuantityStepper value={3} min={1} max={3} onChange={() => {}} />);
    expect(screen.getByLabelText("Increase quantity")).toBeDisabled();
  });
});
