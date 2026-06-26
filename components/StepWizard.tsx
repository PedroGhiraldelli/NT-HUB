import { CheckIcon } from './Icons'

interface StepWizardProps {
  currentStep: number
  totalSteps: number
  stepTitles: string[]
}

export function StepWizard({ currentStep, totalSteps, stepTitles }: StepWizardProps) {
  return (
    <div className="mb-8">
      {/* Barra de progresso */}
      <div className="relative mb-6">
        <div className="absolute left-0 top-4 h-0.5 w-full bg-gray-200">
          <div
            className="h-full bg-nt-accent transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        <div className="relative flex justify-between">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1
            const isCompleted = stepNum < currentStep
            const isCurrent = stepNum === currentStep

            return (
              <div key={stepNum} className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all
                    ${isCompleted ? 'bg-nt-accent text-white' : ''}
                    ${isCurrent ? 'bg-nt-primary text-white ring-2 ring-nt-primary ring-offset-2' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? <CheckIcon size={16} /> : stepNum}
                </div>
                <span
                  className={`mt-2 text-xs font-medium hidden sm:block
                    ${isCurrent ? 'text-nt-primary' : 'text-gray-500'}
                  `}
                >
                  {title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Indicador mobile */}
      <p className="text-center text-sm text-gray-500 sm:hidden">
        Etapa {currentStep} de {totalSteps}: <span className="font-medium text-nt-primary">{stepTitles[currentStep - 1]}</span>
      </p>
    </div>
  )
}
