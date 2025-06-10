import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "./page";
import userEvent from "@testing-library/user-event";

// frontend/src/app/page.test.tsx

// Mock TopMenu and GlobeComponent
jest.mock("@/components/TopMenu", () => () => <div data-testid="top-menu" />);
const mockPointOfView = jest.fn();
jest.mock("@/components/GlobeComponent", () =>
  React.forwardRef((_, ref) => {
    React.useImperativeHandle(ref, () => ({
      pointOfView: mockPointOfView,
    }));
    return <div data-testid="globe" />;
  })
);

// Mock fetch and topojson-client
const mockCountries = [
  {
    type: "Feature",
    properties: { name: "Testland" },
    geometry: { type: "Polygon", coordinates: [] },
  },
  {
    type: "Feature",
    properties: { name: "Examplestan" },
    geometry: { type: "Polygon", coordinates: [] },
  },
];

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        objects: { countries: {} },
      }),
  })
) as jest.Mock;

jest.mock("topojson-client", () => ({
  feature: () => ({
    features: mockCountries,
  }),
}));

// Mock d3-geo
jest.mock("d3-geo", () => ({
  geoCentroid: () => [10, 20],
}));

describe("Home integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders search input and TopMenu", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText(/find countries/i)).toBeInTheDocument();
    expect(screen.getByTestId("top-menu")).toBeInTheDocument();
    expect(screen.getByTestId("globe")).toBeInTheDocument();
  });

  it("focuses input and shows glow effect", async () => {
    render(<Home />);
    const input = screen.getByPlaceholderText(/find countries/i);
    await userEvent.click(input);
    expect(input).toHaveFocus();
  });

  it("searches for a country and calls pointOfView", async () => {
    render(<Home />);
    const input = screen.getByPlaceholderText(/find countries/i);
    fireEvent.change(input, { target: { value: "Testland" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(mockPointOfView).toHaveBeenCalledWith(
        { lat: 20, lng: 10, altitude: 2.5 },
        1000
      );
    });
    expect(input).toHaveValue(""); // Cleared after search
  });

  it("does not call pointOfView for non-existent country", async () => {
    render(<Home />);
    const input = screen.getByPlaceholderText(/find countries/i);
    fireEvent.change(input, { target: { value: "Nowhere" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(mockPointOfView).not.toHaveBeenCalled();
    });
  });

  it("does not search for single character", async () => {
    render(<Home />);
    const input = screen.getByPlaceholderText(/find countries/i);
    fireEvent.change(input, { target: { value: "T" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(mockPointOfView).not.toHaveBeenCalled();
    });
  });

  it("searches with partial match if at least 3 characters", async () => {
    render(<Home />);
    const input = screen.getByPlaceholderText(/find countries/i);
    fireEvent.change(input, { target: { value: "amp" } }); // matches "Examplestan"
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(mockPointOfView).toHaveBeenCalled();
    });
  });
});
