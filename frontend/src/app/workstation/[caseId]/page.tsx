"use client";

import { use } from "react";
import WorkstationPage from "../page";

export default function CaseWorkstationPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const resolvedParams = use(params);
  // WorkstationPage reads caseId from query params or loads defaults
  return <WorkstationPage />;
}
