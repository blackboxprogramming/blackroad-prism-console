import React from "react";
import { Wizard, Question } from "./Wizard";

export interface Runbook {
  id: string;
  title: string;
  questions: Question[];
}

export function Runbooks({ runbook }: { runbook: Runbook }) {
  return (
    <div>
      <h3>{runbook.title}</h3>
      <Wizard questions={runbook.questions} />
    </div>
  );
}

export default Runbooks;
