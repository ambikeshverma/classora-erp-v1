import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import ToastHost from "../components/ToastHost";
import { toast, notifyAlert, confirmDialog, promptDialog, getToasts, dismiss } from "./toast";

const clearAll = () =>
  act(() => {
    getToasts().forEach((t) => dismiss(t.id));
  });

describe("toast service", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clearAll();
  });
  afterEach(() => {
    clearAll();
    jest.useRealTimers();
  });

  test("shows a toast and auto-dismisses it", () => {
    render(<ToastHost />);
    act(() => {
      toast.success("Saved");
    });
    expect(screen.getByText("Saved")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(4500);
    });
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  test("can be dismissed manually and announces errors as alerts", () => {
    render(<ToastHost />);
    act(() => {
      toast.error("Could not save");
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
    fireEvent.click(screen.getByLabelText("Dismiss notification"));
    expect(screen.queryByText("Could not save")).not.toBeInTheDocument();
  });

  test("drops duplicate messages shown within a short window", () => {
    render(<ToastHost />);
    act(() => {
      toast.warning("Select a class");
      toast.warning("Select a class");
    });
    expect(screen.getAllByText("Select a class")).toHaveLength(1);
  });

  test("hides raw server errors", () => {
    render(<ToastHost />);
    act(() => {
      toast.error("Request failed with status code 500");
    });
    expect(screen.queryByText(/status code/)).not.toBeInTheDocument();
    expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });

  test("notifyAlert picks a type from the wording", () => {
    render(<ToastHost />);
    act(() => {
      notifyAlert("Fee head added successfully");
      notifyAlert("Failed to add fee head");
    });
    expect(getToasts().map((t) => t.type)).toEqual(["success", "error"]);
  });

  test("confirmDialog resolves true on confirm and false on cancel", async () => {
    jest.useRealTimers();
    render(<ToastHost />);
    let result;
    act(() => {
      result = confirmDialog("Delete this record?");
    });
    fireEvent.click(screen.getByText("Confirm"));
    await expect(result).resolves.toBe(true);

    act(() => {
      result = confirmDialog("Delete this record?");
    });
    fireEvent.click(screen.getByText("Cancel"));
    await expect(result).resolves.toBe(false);
  });

  test("promptDialog returns the typed reason, or null when cancelled", async () => {
    jest.useRealTimers();
    render(<ToastHost />);
    let result;
    act(() => {
      result = promptDialog("Why?");
    });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "duplicate entry" } });
    fireEvent.click(screen.getByText("Submit"));
    await expect(result).resolves.toBe("duplicate entry");

    act(() => {
      result = promptDialog("Why?");
    });
    fireEvent.click(screen.getByText("Cancel"));
    await expect(result).resolves.toBeNull();
  });
});
