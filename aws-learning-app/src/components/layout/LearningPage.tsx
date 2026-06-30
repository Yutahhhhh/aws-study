import { useState } from 'react';
import { Activity, Info, X } from 'lucide-react';
import type { TopicConfig } from '../../types/topic';
import { defaultModeThemes } from '../../theme/modeThemes';
import { useSimulation } from '../../hooks/useSimulation';
import { useGlossary } from '../../hooks/useGlossary';
import { Header } from '../common/Header';
import { GlossaryModal } from '../glossary/GlossaryModal';
import { ModeSelector } from '../simulation/ModeSelector';
import { ArchitectureDiagram } from '../diagram/ArchitectureDiagram';
import { PacketInspector } from '../simulation/PacketInspector';
import { StepExplanation } from '../simulation/StepExplanation';
import { StepController } from '../simulation/StepController';
import { SimulationLayout } from './SimulationLayout';

interface LearningPageProps {
  topicConfig: TopicConfig;
}

type MobilePanel = 'inspector' | 'explanation' | null;

export const LearningPage = ({ topicConfig }: LearningPageProps) => {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const modeThemes = topicConfig.modeThemes ?? defaultModeThemes;

  const {
    currentMode,
    currentModeId,
    currentStep,
    currentStepIndex,
    totalSteps,
    changeMode,
    nextStep,
    prevStep,
    reset,
  } = useSimulation(topicConfig.modes, topicConfig.defaultModeId);

  const glossaryState = useGlossary();
  const currentTheme = modeThemes[currentMode.themeId] ?? defaultModeThemes.primary;

  const renderInspector = () => (
    <PacketInspector
      headers={currentStep.headers}
      labels={currentStep.labels}
      changes={currentStep.changes}
      location={currentStep.location}
      theme={currentTheme}
      onOpenGlossary={glossaryState.open}
    />
  );

  const renderExplanation = () => (
    <StepExplanation
      title={currentStep.title}
      description={currentStep.desc}
      keyPoints={currentStep.keyPoints}
      onOpenGlossary={glossaryState.open}
    />
  );

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
      <Header
        topicLabel={topicConfig.headerLabel}
        onOpenGlossary={() => glossaryState.open()}
        showGlossaryButton
      />

      <SimulationLayout
        modeSelector={
          <ModeSelector
            modes={topicConfig.modes}
            currentModeId={currentModeId}
            modeThemes={modeThemes}
            onModeChange={changeMode}
          />
        }
        diagram={
          <ArchitectureDiagram
            config={topicConfig.diagram}
            stepState={currentStep.diagramState}
            onNodeClick={glossaryState.open}
            activeTheme={currentTheme}
          />
        }
        controller={
          <StepController
            currentStep={currentStepIndex}
            totalSteps={totalSteps}
            theme={currentTheme}
            onPrevStep={prevStep}
            onNextStep={nextStep}
            onReset={reset}
            onOpenInspector={() => setMobilePanel('inspector')}
            onOpenExplanation={() => setMobilePanel('explanation')}
          />
        }
        inspector={renderInspector()}
        explanation={renderExplanation()}
      />

      {mobilePanel && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-end p-3">
          <div className="w-full max-h-[84vh] overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl flex flex-col">
            <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {mobilePanel === 'inspector' ? (
                  <Activity size={16} className="text-orange-300 shrink-0" />
                ) : (
                  <Info size={16} className="text-amber-300 shrink-0" />
                )}
                <span className="text-xs font-bold text-slate-100 truncate">
                  {mobilePanel === 'inspector' ? 'WIRESHARK VIEW' : 'ステップ解説'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobilePanel(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                aria-label="閉じる"
                title="閉じる"
              >
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto p-3 bg-slate-950">
              {mobilePanel === 'inspector' ? renderInspector() : renderExplanation()}
            </div>
          </div>
        </div>
      )}

      <GlossaryModal
        isOpen={glossaryState.isOpen}
        onClose={glossaryState.close}
        initialTerm={glossaryState.selectedTerm}
        glossaryData={topicConfig.glossary}
        categories={topicConfig.glossaryCategories}
      />
    </div>
  );
};
