import { Activity, Info } from 'lucide-react';
import type { TopicConfig } from '../../types/topic';
import { defaultModeThemes } from '../../theme/modeThemes';
import { useSimulation } from '../../hooks/useSimulation';
import { useGlossary } from '../../hooks/useGlossary';
import { Header } from '../common/Header';
import { FloatingPanel } from '../common/FloatingPanel';
import { GlossaryModal } from '../glossary/GlossaryModal';
import { ModeSelector } from '../simulation/ModeSelector';
import { ArchitectureDiagram } from '../diagram/ArchitectureDiagram';
import { PacketInspector } from '../simulation/PacketInspector';
import { StepExplanation } from '../simulation/StepExplanation';
import { StepController } from '../simulation/StepController';

interface LearningPageProps {
  topicConfig: TopicConfig;
}

export const LearningPage = ({ topicConfig }: LearningPageProps) => {
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

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-950 font-sans text-slate-100">
      <Header
        topicLabel={topicConfig.headerLabel}
        onOpenGlossary={() => glossaryState.open()}
        showGlossaryButton
      />

      <div className="relative min-h-0 flex-1">
        <ArchitectureDiagram
          config={topicConfig.diagram}
          stepState={currentStep.diagramState}
          onNodeClick={glossaryState.open}
          activeTheme={currentTheme}
        />

        {/* top-left: モード切替 */}
        <div className="absolute left-3 top-3 z-30 max-w-[min(80vw,30rem)]">
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur">
            <ModeSelector
              modes={topicConfig.modes}
              currentModeId={currentModeId}
              modeThemes={modeThemes}
              onModeChange={changeMode}
            />
          </div>
        </div>

        {/* top-right: Wireshark ビュー */}
        <div className="absolute right-3 top-3 z-30">
          <FloatingPanel
            icon={<Activity size={15} />}
            label="Wireshark"
            accentClass="text-orange-300"
            align="right"
            width="w-80"
          >
            <PacketInspector
              headers={currentStep.headers}
              labels={currentStep.labels}
              changes={currentStep.changes}
              location={currentStep.location}
              theme={currentTheme}
              onOpenGlossary={glossaryState.open}
            />
          </FloatingPanel>
        </div>

        {/* bottom-left: ステップ解説 */}
        <div className="absolute bottom-3 left-3 z-30">
          <FloatingPanel icon={<Info size={15} />} label="解説" accentClass="text-amber-300" width="w-80">
            <StepExplanation
              title={currentStep.title}
              description={currentStep.desc}
              keyPoints={currentStep.keyPoints}
              onOpenGlossary={glossaryState.open}
            />
          </FloatingPanel>
        </div>

        {/* bottom-center: ステップ制御ドック */}
        <div className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2">
          <StepController
            currentStep={currentStepIndex}
            totalSteps={totalSteps}
            theme={currentTheme}
            onPrevStep={prevStep}
            onNextStep={nextStep}
            onReset={reset}
          />
        </div>
      </div>

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
