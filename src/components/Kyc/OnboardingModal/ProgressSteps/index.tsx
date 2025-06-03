export enum ProgressStatusEnum {
  COMPLETED = "completed",
  CURRENT = "current",
  UPCOMING = "upcoming",
}

export interface Step {
  id: number;
  title: string;
  status: ProgressStatusEnum;
  onClick: () => void;
}

export interface ProgressStepsProps {
  steps: Step[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 h-full w-[2px] bg-gray-200" />
      <div className="relative space-y-8">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={step.onClick}
            className="flex items-center gap-4 hover:opacity-80 disabled:opacity-50"
            disabled={step.status === "upcoming"}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step.status === "current"
                  ? "bg-black text-white"
                  : step.status === "completed"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {step.id}
            </div>
            <span
              className={`text-sm font-medium ${
                step.status === "current"
                  ? "text-gray-900"
                  : step.status === "completed"
                    ? "text-gray-600"
                    : "text-gray-400"
              }`}
            >
              {step.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
