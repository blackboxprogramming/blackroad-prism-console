import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Wizard, Question } from "../src/components/prism/Wizard";

describe("Wizard", () => {
  it("shows conditional question", () => {
    const questions: Question[] = [
      { id: "q1", text: "Q1", kind: "boolean" },
      { id: "q2", text: "Q2", kind: "text", when: [{ questionId: "q1", equals: true }] },
    ];
    const { queryByLabelText } = render(<Wizard questions={questions} />);
    expect(queryByLabelText("Q2")).toBeNull();
    const q1 = queryByLabelText("Q1") as HTMLInputElement;
    fireEvent.click(q1);
    expect(queryByLabelText("Q2")).not.toBeNull();
  });
});
